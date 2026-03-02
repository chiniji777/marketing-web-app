"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Locale, TranslationDictionary } from "@/lib/i18n/types"
import { en } from "@/lib/i18n/locales/en"
import { th } from "@/lib/i18n/locales/th"

const dictionaries: Record<Locale, TranslationDictionary> = { en, th }

const STORAGE_KEY = "marketpro-locale"

/** Detect if the user's timezone is in Thailand */
function detectDefaultLocale(): Locale {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz === "Asia/Bangkok" || tz === "Asia/Vientiane" || tz === "Asia/Phnom_Penh") {
      return "th"
    }
  } catch {
    // Intl not supported, fall back to English
  }
  return "en"
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationDictionary
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [hydrated, setHydrated] = useState(false)

  // Initialize locale from localStorage or timezone detection
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === "en" || stored === "th")) {
      setLocaleState(stored)
    } else {
      const detected = detectDefaultLocale()
      setLocaleState(detected)
      localStorage.setItem(STORAGE_KEY, detected)
    }
    setHydrated(true)
  }, [])

  // Update <html lang> attribute when locale changes
  useEffect(() => {
    if (hydrated) {
      document.documentElement.lang = locale
    }
  }, [locale, hydrated])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = dictionaries[locale]

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return ctx
}

/** Convenience hook that returns only the translation dictionary */
export function useTranslations() {
  return useLocale().t
}
