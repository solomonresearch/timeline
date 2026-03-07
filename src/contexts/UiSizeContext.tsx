import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type UiSize = 'small' | 'medium' | 'large' | 'fitscreen'

export interface SizeConfig {
  BASE_LANE_HEIGHT: number
  PERSONA_SUB_ROW_HEIGHT: number
  BAR_HEIGHT: number
  DOT_SIZE: number
  TOTAL_ASSETS_HEIGHT: number
  HEADER_HEIGHT: number
  SIDEBAR_WIDTH: number
  TICK_FONT: number
  MIN_TICK_PX: number
  EVENT_FONT: number
  EVENT_LINE_HEIGHT: number
  SIDEBAR_FONT: number
  ICON_SIZE: number
  TOTAL_LABEL_HEIGHT: number
  TOTAL_PAD_V: number
}

export const SIZE_PRESETS: Record<Exclude<UiSize, 'fitscreen'>, SizeConfig> = {
  small: {
    BASE_LANE_HEIGHT: 28, PERSONA_SUB_ROW_HEIGHT: 22, BAR_HEIGHT: 18, DOT_SIZE: 12,
    TOTAL_ASSETS_HEIGHT: 64, HEADER_HEIGHT: 24, SIDEBAR_WIDTH: 160,
    TICK_FONT: 10, MIN_TICK_PX: 26,
    EVENT_FONT: 10, EVENT_LINE_HEIGHT: 18,
    SIDEBAR_FONT: 12, ICON_SIZE: 12,
    TOTAL_LABEL_HEIGHT: 14, TOTAL_PAD_V: 4,
  },
  medium: {
    BASE_LANE_HEIGHT: 42, PERSONA_SUB_ROW_HEIGHT: 33, BAR_HEIGHT: 27, DOT_SIZE: 18,
    TOTAL_ASSETS_HEIGHT: 96, HEADER_HEIGHT: 36, SIDEBAR_WIDTH: 220,
    TICK_FONT: 14, MIN_TICK_PX: 38,
    EVENT_FONT: 14, EVENT_LINE_HEIGHT: 26,
    SIDEBAR_FONT: 15, ICON_SIZE: 18,
    TOTAL_LABEL_HEIGHT: 21, TOTAL_PAD_V: 6,
  },
  large: {
    BASE_LANE_HEIGHT: 56, PERSONA_SUB_ROW_HEIGHT: 44, BAR_HEIGHT: 36, DOT_SIZE: 24,
    TOTAL_ASSETS_HEIGHT: 128, HEADER_HEIGHT: 48, SIDEBAR_WIDTH: 280,
    TICK_FONT: 20, MIN_TICK_PX: 52,
    EVENT_FONT: 20, EVENT_LINE_HEIGHT: 36,
    SIDEBAR_FONT: 20, ICON_SIZE: 24,
    TOTAL_LABEL_HEIGHT: 28, TOTAL_PAD_V: 8,
  },
}

/** Scale a SizeConfig proportionally by `scale`, clamping each field to a minimum. */
export function scaleSizeConfig(ref: SizeConfig, scale: number): SizeConfig {
  const s = (v: number, min: number) => Math.max(min, Math.round(v * scale))
  return {
    BASE_LANE_HEIGHT:       s(ref.BASE_LANE_HEIGHT, 12),
    PERSONA_SUB_ROW_HEIGHT: s(ref.PERSONA_SUB_ROW_HEIGHT, 10),
    BAR_HEIGHT:             s(ref.BAR_HEIGHT, 8),
    DOT_SIZE:               s(ref.DOT_SIZE, 6),
    TOTAL_ASSETS_HEIGHT:    s(ref.TOTAL_ASSETS_HEIGHT, 32),
    HEADER_HEIGHT:          s(ref.HEADER_HEIGHT, 16),
    SIDEBAR_WIDTH:          s(ref.SIDEBAR_WIDTH, 80),
    TICK_FONT:              s(ref.TICK_FONT, 7),
    MIN_TICK_PX:            s(ref.MIN_TICK_PX, 12),
    EVENT_FONT:             s(ref.EVENT_FONT, 7),
    EVENT_LINE_HEIGHT:      s(ref.EVENT_LINE_HEIGHT, 8),
    SIDEBAR_FONT:           s(ref.SIDEBAR_FONT, 7),
    ICON_SIZE:              s(ref.ICON_SIZE, 8),
    TOTAL_LABEL_HEIGHT:     s(ref.TOTAL_LABEL_HEIGHT, 8),
    TOTAL_PAD_V:            s(ref.TOTAL_PAD_V, 2),
  }
}

interface UiSizeContextValue {
  size: UiSize
  sc: SizeConfig
  setSize: (s: UiSize) => void
  updateFitScreenConfig: (config: SizeConfig) => void
}

const UiSizeContext = createContext<UiSizeContextValue>({
  size: 'medium',
  sc: SIZE_PRESETS.medium,
  setSize: () => {},
  updateFitScreenConfig: () => {},
})

export function UiSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<UiSize>(() => {
    const saved = localStorage.getItem('ui-size') as UiSize | null
    if (saved) return saved
    // Default: fitscreen on mobile/tablet, medium on desktop
    return window.matchMedia('(max-width: 767px)').matches ? 'fitscreen' : 'medium'
  })
  const [fitScreenConfig, setFitScreenConfig] = useState<SizeConfig>(SIZE_PRESETS.large)

  function handleSetSize(s: UiSize) {
    setSize(s)
    localStorage.setItem('ui-size', s)
  }

  // Only update when BASE_LANE_HEIGHT actually changes to avoid render loops
  const updateFitScreenConfig = useCallback((config: SizeConfig) => {
    setFitScreenConfig(prev =>
      prev.BASE_LANE_HEIGHT === config.BASE_LANE_HEIGHT ? prev : config
    )
  }, [])

  const sc = size === 'fitscreen' ? fitScreenConfig : SIZE_PRESETS[size]

  return (
    <UiSizeContext.Provider value={{ size, sc, setSize: handleSetSize, updateFitScreenConfig }}>
      {children}
    </UiSizeContext.Provider>
  )
}

export function useSizeConfig() {
  return useContext(UiSizeContext)
}
