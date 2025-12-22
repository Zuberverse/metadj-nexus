"use client"

import { useEffect, useCallback, type RefObject } from "react"

/**
 * useClickAway Hook
 * 
 * Detects clicks or touches outside a referenced element and triggers a callback.
 * Useful for closing dropdowns, popovers, and modals.
 * 
 * @param ref - React RefObject for the element to detect clicks outside of
 * @param onClickAway - Callback function to execute when a click outside occurs
 * @param options - Optional configuration
 * @param options.enabled - Whether the click-away listener is active (default: true)
 * @param options.events - Events to listen for (default: ['mousedown', 'touchstart'])
 */
interface UseClickAwayOptions {
    enabled?: boolean
    events?: string[]
}

export function useClickAway(
    ref: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
    onClickAway: () => void,
    options: UseClickAwayOptions = {}
): void {
    const { enabled = true, events = ["mousedown", "touchstart"] } = options

    const handleEvent = useCallback(
        (event: Event) => {
            const refs = Array.isArray(ref) ? ref : [ref]
            const isInside = refs.some((r) => r.current && r.current.contains(event.target as Node))

            if (isInside) {
                return
            }

            onClickAway()
        },
        [ref, onClickAway]
    )

    useEffect(() => {
        if (!enabled) return

        events.forEach((eventName) => {
            document.addEventListener(eventName, handleEvent)
        })

        return () => {
            events.forEach((eventName) => {
                document.removeEventListener(eventName, handleEvent)
            })
        }
    }, [enabled, handleEvent, events])
}
