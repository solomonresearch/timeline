import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export interface CustomSkinInput {
  background: string
  foreground: string
  primary: string
  surface: string
  border: string
  fontFamily: string // 'system' | 'serif' | 'mono'
}

const DEFAULT_CUSTOM: CustomSkinInput = {
  background: '#ffffff',
  foreground: '#09090b',
  primary: '#18181b',
  surface: '#f4f4f5',
  border: '#e4e4e7',
  fontFamily: 'system',
}

export type SkinId = 'classic' | 'dark' | 'sepia' | 'ocean' | 'forest' | 'midnight' | 'custom'

export interface SkinDef {
  id: Exclude<SkinId, 'custom'>
  name: string
  bgColor: string    // for swatch preview
  accentColor: string
  vars: Record<string, string>
}

const FONT_MAP: Record<string, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Courier New", Courier, monospace',
}

export const SKINS: SkinDef[] = [
  {
    id: 'classic', name: 'Classic', bgColor: '#ffffff', accentColor: '#18181b',
    vars: {
      background: '#ffffff', foreground: '#09090b',
      card: '#ffffff', 'card-foreground': '#09090b',
      popover: '#ffffff', 'popover-foreground': '#09090b',
      primary: '#18181b', 'primary-foreground': '#fafafa',
      secondary: '#f4f4f5', 'secondary-foreground': '#18181b',
      muted: '#f4f4f5', 'muted-foreground': '#71717a',
      accent: '#f4f4f5', 'accent-foreground': '#18181b',
      border: '#e4e4e7', input: '#e4e4e7', ring: '#18181b',
      fontFamily: FONT_MAP.system,
    },
  },
  {
    id: 'dark', name: 'Dark', bgColor: '#18181b', accentColor: '#a1a1aa',
    vars: {
      background: '#18181b', foreground: '#fafafa',
      card: '#27272a', 'card-foreground': '#fafafa',
      popover: '#27272a', 'popover-foreground': '#fafafa',
      primary: '#fafafa', 'primary-foreground': '#18181b',
      secondary: '#27272a', 'secondary-foreground': '#fafafa',
      muted: '#27272a', 'muted-foreground': '#a1a1aa',
      accent: '#27272a', 'accent-foreground': '#fafafa',
      border: '#3f3f46', input: '#3f3f46', ring: '#d4d4d8',
      fontFamily: FONT_MAP.system,
    },
  },
  {
    id: 'sepia', name: 'Sepia', bgColor: '#f5f0e8', accentColor: '#8b6343',
    vars: {
      background: '#f5f0e8', foreground: '#3b2f1e',
      card: '#faf7f2', 'card-foreground': '#3b2f1e',
      popover: '#faf7f2', 'popover-foreground': '#3b2f1e',
      primary: '#8b6343', 'primary-foreground': '#fdf6ee',
      secondary: '#ede5d6', 'secondary-foreground': '#5c4a30',
      muted: '#ece6d9', 'muted-foreground': '#8a7560',
      accent: '#ede5d6', 'accent-foreground': '#5c4a30',
      border: '#d4c9b5', input: '#d4c9b5', ring: '#8b6343',
      fontFamily: FONT_MAP.serif,
    },
  },
  {
    id: 'ocean', name: 'Ocean', bgColor: '#f0f7ff', accentColor: '#1d6fa4',
    vars: {
      background: '#f0f7ff', foreground: '#0c1a2e',
      card: '#ffffff', 'card-foreground': '#0c1a2e',
      popover: '#ffffff', 'popover-foreground': '#0c1a2e',
      primary: '#1d6fa4', 'primary-foreground': '#f0f7ff',
      secondary: '#e0eef8', 'secondary-foreground': '#1d4a6e',
      muted: '#ddeef8', 'muted-foreground': '#4a7a9b',
      accent: '#e0eef8', 'accent-foreground': '#1d4a6e',
      border: '#b8d4ea', input: '#b8d4ea', ring: '#1d6fa4',
      fontFamily: FONT_MAP.system,
    },
  },
  {
    id: 'forest', name: 'Forest', bgColor: '#f2f5f0', accentColor: '#2d6a2d',
    vars: {
      background: '#f2f5f0', foreground: '#1a2e1a',
      card: '#ffffff', 'card-foreground': '#1a2e1a',
      popover: '#ffffff', 'popover-foreground': '#1a2e1a',
      primary: '#2d6a2d', 'primary-foreground': '#f2f5f0',
      secondary: '#dcebd7', 'secondary-foreground': '#1a3d1a',
      muted: '#d8e8d3', 'muted-foreground': '#4a7a4a',
      accent: '#dcebd7', 'accent-foreground': '#1a3d1a',
      border: '#b5d4ad', input: '#b5d4ad', ring: '#2d6a2d',
      fontFamily: FONT_MAP.system,
    },
  },
  {
    id: 'midnight', name: 'Midnight', bgColor: '#0f0f1a', accentColor: '#7c6fd4',
    vars: {
      background: '#0f0f1a', foreground: '#e8e8f0',
      card: '#16162a', 'card-foreground': '#e8e8f0',
      popover: '#16162a', 'popover-foreground': '#e8e8f0',
      primary: '#7c6fd4', 'primary-foreground': '#0f0f1a',
      secondary: '#1e1e36', 'secondary-foreground': '#c8c8e0',
      muted: '#1e1e36', 'muted-foreground': '#8888b0',
      accent: '#1e1e36', 'accent-foreground': '#c8c8e0',
      border: '#2e2e50', input: '#2e2e50', ring: '#7c6fd4',
      fontFamily: FONT_MAP.system,
    },
  },
]

function getLuminance(hex: string): number {
  if (hex.length < 7) return 0.5
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function blendHex(hex1: string, hex2: string, t: number): string {
  if (hex1.length < 7 || hex2.length < 7) return hex1
  const r = Math.round(parseInt(hex1.slice(1, 3), 16) * (1 - t) + parseInt(hex2.slice(1, 3), 16) * t)
  const g = Math.round(parseInt(hex1.slice(3, 5), 16) * (1 - t) + parseInt(hex2.slice(3, 5), 16) * t)
  const b = Math.round(parseInt(hex1.slice(5, 7), 16) * (1 - t) + parseInt(hex2.slice(5, 7), 16) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function deriveCustomVars(input: CustomSkinInput): Record<string, string> {
  const primaryFg = getLuminance(input.primary) > 0.35 ? '#09090b' : '#fafafa'
  const mutedFg = blendHex(input.foreground, input.surface, 0.45)
  return {
    background: input.background,
    foreground: input.foreground,
    card: input.surface,
    'card-foreground': input.foreground,
    popover: input.surface,
    'popover-foreground': input.foreground,
    primary: input.primary,
    'primary-foreground': primaryFg,
    secondary: input.surface,
    'secondary-foreground': input.foreground,
    muted: input.surface,
    'muted-foreground': mutedFg,
    accent: input.surface,
    'accent-foreground': input.foreground,
    border: input.border,
    input: input.border,
    ring: input.primary,
    fontFamily: FONT_MAP[input.fontFamily] ?? FONT_MAP.system,
  }
}

interface SkinContextValue {
  skinId: SkinId
  setSkinId: (id: SkinId) => void
  customInput: CustomSkinInput
  setCustomInput: (input: CustomSkinInput) => void
}

const SkinContext = createContext<SkinContextValue>({
  skinId: 'classic',
  setSkinId: () => {},
  customInput: DEFAULT_CUSTOM,
  setCustomInput: () => {},
})

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skinId, setSkinIdRaw] = useState<SkinId>(
    () => (localStorage.getItem('skin-id') as SkinId | null) ?? 'sepia'
  )
  const [customInput, setCustomInputRaw] = useState<CustomSkinInput>(() => {
    try {
      const saved = localStorage.getItem('skin-custom')
      return saved ? { ...DEFAULT_CUSTOM, ...JSON.parse(saved) } : DEFAULT_CUSTOM
    } catch {
      return DEFAULT_CUSTOM
    }
  })

  const setSkinId = useCallback((id: SkinId) => {
    setSkinIdRaw(id)
    localStorage.setItem('skin-id', id)
  }, [])

  const setCustomInput = useCallback((input: CustomSkinInput) => {
    setCustomInputRaw(input)
    localStorage.setItem('skin-custom', JSON.stringify(input))
  }, [])

  const vars =
    skinId === 'custom'
      ? deriveCustomVars(customInput)
      : (SKINS.find(s => s.id === skinId)?.vars ?? SKINS[0].vars)

  useEffect(() => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(vars)) {
      if (k === 'fontFamily') {
        document.body.style.fontFamily = v
      } else {
        root.style.setProperty(`--color-${k}`, v)
      }
    }
  }, [vars])

  return (
    <SkinContext.Provider value={{ skinId, setSkinId, customInput, setCustomInput }}>
      {children}
    </SkinContext.Provider>
  )
}

export function useSkin() {
  return useContext(SkinContext)
}
