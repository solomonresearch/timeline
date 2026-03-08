import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { Sparkles, Mic, Square, ChevronRight, Loader2, ChevronLeft } from 'lucide-react'
import type { Lane, TimelineEvent } from '@/types/timeline'
import { generateQuestionnaireEvents, transcribeAudio, type QuestionnaireParsedEvent } from '@/lib/openai'
import { mapCategoryToLane } from '@/lib/calendarParser'

type Phase = 'welcome' | 'questions' | 'generating' | 'preview' | 'importing' | 'complete'

const QUESTIONS = [
  { lane: 'Location', question: 'Where have you lived? Mention cities/countries and approximate years.' },
  { lane: 'University', question: 'Tell me about your education — schools, universities, degrees, and when.' },
  { lane: 'Work', question: 'What jobs or careers have you had? Include company names and years.' },
  { lane: 'Relations', question: 'Any significant relationships? Partnerships, marriages, key dates.' },
  { lane: 'Kids', question: 'Tell me about your family — children, parents, family milestones.' },
  { lane: 'Other Activities', question: 'Any other major life events? Hobbies, achievements, moves, travel.' },
]

interface Props {
  lanes: Lane[]
  addEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<TimelineEvent | null>
  birthYear: number
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingQuestionnaire({ lanes, addEvent, birthYear, onComplete, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(() => Array(QUESTIONS.length).fill(''))
  const [error, setError] = useState('')

  // Voice recording state
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Preview state
  const [parsedEvents, setParsedEvents] = useState<QuestionnaireParsedEvent[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [laneAssignments, setLaneAssignments] = useState<Map<number, string>>(new Map())
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)

  const laneNames = useMemo(() => lanes.map(l => l.name), [lanes])

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = ['audio/webm', 'audio/ogg', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setRecording(false)
        setElapsed(0)

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size === 0) return

        setTranscribing(true)
        try {
          const text = await transcribeAudio(blob)
          if (text) {
            setAnswers(prev => {
              const next = [...prev]
              next[step] = prev[step] ? `${prev[step]} ${text}` : text
              return next
            })
          }
        } catch {
          setError('Failed to transcribe audio')
        } finally {
          setTranscribing(false)
        }
      }

      recorder.start()
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } catch {
      setError('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      setError('')
    } else {
      handleGenerate()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
      setError('')
    }
  }

  const handleGenerate = async () => {
    const nonEmpty = QUESTIONS
      .map((q, i) => ({ question: q.question, answer: answers[i] }))
      .filter(a => a.answer.trim())

    if (nonEmpty.length === 0) {
      onSkip()
      return
    }

    setPhase('generating')
    setError('')

    try {
      const events = await generateQuestionnaireEvents(nonEmpty, birthYear, laneNames)
      setParsedEvents(events)

      // Auto-assign lanes + select all
      const assignments = new Map<number, string>()
      const selected = new Set<number>()
      events.forEach((ev, i) => {
        assignments.set(i, mapCategoryToLane(ev.category, laneNames))
        selected.add(i)
      })
      setLaneAssignments(assignments)
      setSelectedIndices(selected)
      setPhase('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate events')
      setPhase('questions')
      setStep(QUESTIONS.length - 1)
    }
  }

  const handleImport = async () => {
    setPhase('importing')
    setImportProgress(0)

    const selected = parsedEvents
      .map((ev, i) => ({ ev, i }))
      .filter(({ i }) => selectedIndices.has(i))

    let count = 0
    for (let j = 0; j < selected.length; j++) {
      const { ev, i } = selected[j]
      const laneName = laneAssignments.get(i) || 'Other Activities'
      const lane = lanes.find(l => l.name === laneName)
      if (!lane) continue

      const result = await addEvent({
        laneId: lane.id,
        title: ev.title,
        description: ev.description,
        type: ev.endYear ? 'range' : 'point',
        startYear: ev.startYear,
        endYear: ev.endYear,
      })
      if (result) count++
      setImportProgress(j + 1)
    }

    setImportedCount(count)
    setPhase('complete')
  }

  // Year-grouped events for preview
  const yearGroups = useMemo(() => {
    const groups = new Map<number, { idx: number; ev: QuestionnaireParsedEvent }[]>()
    for (let i = 0; i < parsedEvents.length; i++) {
      const ev = parsedEvents[i]
      const year = Math.floor(ev.startYear)
      const arr = groups.get(year)
      if (arr) arr.push({ idx: i, ev })
      else groups.set(year, [{ idx: i, ev }])
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0])
  }, [parsedEvents])

  const toggleAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedIndices(new Set(parsedEvents.map((_, i) => i)))
    } else {
      setSelectedIndices(new Set())
    }
  }, [parsedEvents])

  const toggleYear = useCallback((year: number) => {
    const items = yearGroups.find(([y]) => y === year)?.[1] || []
    const allSelected = items.every(({ idx }) => selectedIndices.has(idx))
    const next = new Set(selectedIndices)
    for (const { idx } of items) {
      if (allSelected) next.delete(idx)
      else next.add(idx)
    }
    setSelectedIndices(next)
  }, [yearGroups, selectedIndices])

  const totalSelected = selectedIndices.size

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto p-6">

        {/* Welcome */}
        {phase === 'welcome' && (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Welcome to your Life Timeline</h1>
            <p className="text-muted-foreground text-lg">
              Let's populate your timeline with some life events.
              Answer a few quick questions — type or use your voice.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPhase('questions')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Let's Go
              </button>
              <button
                onClick={onSkip}
                className="px-6 py-2 text-muted-foreground hover:text-foreground"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Questions */}
        {phase === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground">
                Skip all
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl font-semibold">{QUESTIONS[step].question}</h2>

            <div className="relative">
              <textarea
                value={answers[step]}
                onChange={e => {
                  const val = e.target.value
                  setAnswers(prev => {
                    const next = [...prev]
                    next[step] = val
                    return next
                  })
                }}
                placeholder="Type your answer here, or use the mic button to speak..."
                className="w-full h-32 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={recording || transcribing}
              />

              {/* Mic button */}
              <div className="absolute bottom-3 right-3">
                {transcribing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : recording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                  >
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    {formatTime(elapsed)}
                    <Square className="h-3 w-3 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Record voice answer"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 justify-between">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-md hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  {step === QUESTIONS.length - 1 ? 'Generate Timeline' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating */}
        {phase === 'generating' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg">Generating your timeline events...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        )}

        {/* Preview */}
        {phase === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Preview Events</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> = AI-suggested
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={totalSelected === parsedEvents.length}
                  ref={el => { if (el) el.indeterminate = totalSelected > 0 && totalSelected < parsedEvents.length }}
                  onChange={e => toggleAll(e.target.checked)}
                  className="accent-primary"
                />
                Select all
              </label>
              <span className="text-muted-foreground">
                {totalSelected} of {parsedEvents.length} selected
              </span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <tbody>
                  {yearGroups.map(([year, items]) => {
                    const allSelected = items.every(({ idx }) => selectedIndices.has(idx))
                    const someSelected = !allSelected && items.some(({ idx }) => selectedIndices.has(idx))
                    return (
                      <YearGroup
                        key={year}
                        year={year}
                        items={items}
                        allSelected={allSelected}
                        someSelected={someSelected}
                        selectedIndices={selectedIndices}
                        laneAssignments={laneAssignments}
                        laneNames={laneNames}
                        onToggleYear={() => toggleYear(year)}
                        onToggleEvent={(idx) => {
                          const next = new Set(selectedIndices)
                          if (next.has(idx)) next.delete(idx)
                          else next.add(idx)
                          setSelectedIndices(next)
                        }}
                        onSetLane={(idx, lane) => {
                          setLaneAssignments(prev => new Map(prev).set(idx, lane))
                        }}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-between">
              <button
                onClick={() => { setPhase('questions'); setStep(QUESTIONS.length - 1) }}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-md hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleImport}
                disabled={totalSelected === 0}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm disabled:opacity-50"
              >
                Import {totalSelected} Event{totalSelected !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Importing */}
        {phase === 'importing' && (
          <div className="text-center space-y-4">
            <p className="text-lg">Importing events...</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(importProgress / totalSelected) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {importProgress} of {totalSelected}
            </p>
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Timeline Created!</h2>
            <p className="text-muted-foreground">
              Successfully added {importedCount} event{importedCount !== 1 ? 's' : ''} to your timeline.
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Year group row for preview table — same pattern as FileYearGroup but with sparkle indicator
function YearGroup({
  year, items, allSelected, someSelected,
  selectedIndices, laneAssignments, laneNames,
  onToggleYear, onToggleEvent, onSetLane,
}: {
  year: number
  items: { idx: number; ev: QuestionnaireParsedEvent }[]
  allSelected: boolean
  someSelected: boolean
  selectedIndices: Set<number>
  laneAssignments: Map<number, string>
  laneNames: string[]
  onToggleYear: () => void
  onToggleEvent: (idx: number) => void
  onSetLane: (idx: number, lane: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <tr className="bg-muted/50 border-t border-muted">
        <td className="px-2 py-1">
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected }}
            onChange={onToggleYear}
            className="accent-primary"
          />
        </td>
        <td
          colSpan={2}
          className="px-2 py-1 font-medium cursor-pointer select-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="inline-flex items-center gap-1">
            <ChevronRight className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            {year}
          </span>
        </td>
        <td className="px-2 py-1 text-muted-foreground text-right">
          {items.length} event{items.length !== 1 ? 's' : ''}
        </td>
      </tr>
      {!collapsed && items.map(({ idx, ev }) => (
        <tr key={idx} className="border-t border-muted/50">
          <td className="px-2 py-1">
            <input
              type="checkbox"
              checked={selectedIndices.has(idx)}
              onChange={() => onToggleEvent(idx)}
              className="accent-primary"
            />
          </td>
          <td className="px-2 py-1 truncate max-w-[160px]" title={ev.title}>
            <span className="inline-flex items-center gap-1">
              {ev.isRecommended && <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />}
              {ev.title}
            </span>
          </td>
          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">
            {Math.floor(ev.startYear)}{ev.endYear ? `\u2013${Math.floor(ev.endYear)}` : ''}
          </td>
          <td className="px-2 py-1">
            <select
              value={laneAssignments.get(idx) || 'Other Activities'}
              onChange={e => onSetLane(idx, e.target.value)}
              className="w-full text-xs bg-transparent border rounded px-1 py-0.5"
            >
              {laneNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </td>
        </tr>
      ))}
    </>
  )
}
