import { createContext, useContext, useState, type ReactNode } from 'react'

export type UiSize = 'small' | 'medium' | 'large'

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

export const SIZE_PRESETS: Record<UiSize, SizeConfig> = {
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

interface UiSizeContextValue {
  size: UiSize
  sc: SizeConfig
  setSize: (s: UiSize) => void
}

const UiSizeContext = createContext<UiSizeContextValue>({
  size: 'medium',
  sc: SIZE_PRESETS.medium,
  setSize: () => {},
})

export function UiSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<UiSize>(() =>
    (localStorage.getItem('ui-size') as UiSize | null) ?? 'medium'
  )

  function handleSetSize(s: UiSize) {
    setSize(s)
    localStorage.setItem('ui-size', s)
  }

  return (
    <UiSizeContext.Provider value={{ size, sc: SIZE_PRESETS[size], setSize: handleSetSize }}>
      {children}
    </UiSizeContext.Provider>
  )
}

export function useSizeConfig() {
  return useContext(UiSizeContext)
}
