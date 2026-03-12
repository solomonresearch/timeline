import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert an ISO date string (e.g. "1980-07-15") to a fractional year (e.g. 1980.537). */
export function birthDateToFloatYear(isoDate: string): number {
  const d = new Date(isoDate)
  const year = d.getUTCFullYear()
  const startOfYear = Date.UTC(year, 0, 1)
  const startOfNextYear = Date.UTC(year + 1, 0, 1)
  return year + (d.getTime() - startOfYear) / (startOfNextYear - startOfYear)
}
