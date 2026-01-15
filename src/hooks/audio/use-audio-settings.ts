"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

const STORAGE_KEY = "metadj-audio-settings"

interface AudioSettings {
  crossfadeEnabled: boolean
}

const defaultSettings: AudioSettings = {
  crossfadeEnabled: false,
}

export function useAudioSettings() {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    async function loadSettings() {
      if (isAuthenticated && user) {
        try {
          const response = await fetch('/api/auth/preferences')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.preferences?.audio) {
              setSettings({
                crossfadeEnabled: data.preferences.audio.crossfadeEnabled ?? false,
              })
            } else {
              setSettings(defaultSettings)
            }
          }
        } catch {
          loadFromLocalStorage()
        }
      } else {
        loadFromLocalStorage()
      }
      setIsLoaded(true)
    }

    function loadFromLocalStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<AudioSettings>
          setSettings({ ...defaultSettings, ...parsed })
        }
      } catch {
        // Ignore parse errors
      }
    }

    loadSettings()
  }, [isAuthenticated, user])

  const syncSettings = useCallback(async (newSettings: AudioSettings) => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    try {
      if (isAuthenticated) {
        const response = await fetch('/api/auth/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'audio',
            updates: { crossfadeEnabled: newSettings.crossfadeEnabled },
          }),
        })
        
        if (!response.ok) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      }
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // Ignore storage errors
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [isAuthenticated])

  const setCrossfadeEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, crossfadeEnabled: enabled }
      syncSettings(next)
      return next
    })
  }, [syncSettings])

  return {
    crossfadeEnabled: settings.crossfadeEnabled,
    setCrossfadeEnabled,
    isLoaded,
  }
}
