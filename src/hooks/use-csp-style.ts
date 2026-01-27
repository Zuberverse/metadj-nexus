"use client"

import { useEffect, useId, useMemo } from "react"

type StyleValue = string | number | null | undefined
type StyleMap = Record<string, StyleValue>

type CspStyleOptions = {
    selector?: string
}

const STYLE_RULES = new Map<string, CSSStyleRule>()

const getCspNonce = () => {
    if (typeof document === "undefined") return null
    const nonce = document.documentElement.dataset.cspNonce
    if (nonce) return nonce
    const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
    return meta?.content ?? null
}

const getStyleSheet = () => {
    if (typeof document === "undefined") return null
    let styleEl = document.getElementById("csp-dynamic-styles") as HTMLStyleElement | null
    if (!styleEl) {
        styleEl = document.createElement("style")
        styleEl.id = "csp-dynamic-styles"
        const nonce = getCspNonce()
        if (nonce) {
            styleEl.setAttribute("nonce", nonce)
        }
        document.head.appendChild(styleEl)
    }
    return styleEl.sheet as CSSStyleSheet | null
}

const toKebabCase = (input: string) => {
    if (input.startsWith("--")) return input
    return input.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

const serializeStyles = (styles: StyleMap) =>
    Object.entries(styles)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
        .join(" ")

export const useCspStyle = (styles: StyleMap, options: CspStyleOptions = {}) => {
    // Use React's useId() for stable hydration - generates consistent IDs between server and client
    const reactId = useId()
    const stableId = `csp${reactId.replace(/:/g, "-")}`
    const selector = useMemo(() => {
        const base = `[data-csp-style="${stableId}"]`
        if (!options.selector) return base
        const suffix = options.selector.startsWith(":") || options.selector.startsWith("[")
            ? options.selector
            : ` ${options.selector}`
        return `${base}${suffix}`
    }, [stableId, options.selector])
    const serialized = useMemo(() => serializeStyles(styles), [styles])

    useEffect(() => {
        const sheet = getStyleSheet()
        if (!sheet) return

        let rule = STYLE_RULES.get(stableId)
        if (!rule || rule.selectorText !== selector) {
            if (rule) {
                const index = Array.from(sheet.cssRules).indexOf(rule)
                if (index >= 0) sheet.deleteRule(index)
            }
            const ruleIndex = sheet.insertRule(`${selector} {}`, sheet.cssRules.length)
            rule = sheet.cssRules[ruleIndex] as CSSStyleRule
            STYLE_RULES.set(stableId, rule)
        }

        rule.style.cssText = serialized

        return () => {
            const existing = STYLE_RULES.get(stableId)
            if (!existing) return
            const index = Array.from(sheet.cssRules).indexOf(existing)
            if (index >= 0) sheet.deleteRule(index)
            STYLE_RULES.delete(stableId)
        }
    }, [stableId, selector, serialized])

    return stableId
}
