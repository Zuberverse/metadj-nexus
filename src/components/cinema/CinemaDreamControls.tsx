"use client"

import { useState, useRef } from "react"
import { Sparkles, Hourglass, X, ChevronDown, Monitor, Minimize, Maximize, LayoutTemplate, AlignCenter, ArrowDown, ArrowDownLeft, ArrowDownRight, User, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useResponsivePanels, useClickAway } from "@/hooks"
import type { DaydreamPresentation, DaydreamStatus } from "@/types/daydream"

interface CinemaDreamControlsProps {
  dreamStatus: DaydreamStatus
  dreamConfigured: boolean | null
  webglContextLost: boolean
  isVisualizerScene: boolean
  onDreamToggle: () => void
  onRetryDream: () => void
  frameSize: "default" | "small"
  onFrameSizeChange: (size: "default" | "small") => void
  framePosition: "center" | "bottom-center" | "bottom-left" | "bottom-right" | "top" | "bottom"
  onFramePositionChange: (position: "center" | "bottom-center" | "bottom-left" | "bottom-right" | "top" | "bottom") => void
  presentation: DaydreamPresentation
  onPresentationChange: (presentation: DaydreamPresentation) => void
  /** Force re-sync the current prompt (used when selecting the same persona) */
  onForceSync?: () => void
  isOverlayHidden: boolean
  onOverlayHiddenChange: (hidden: boolean) => void
  /** When true, only show Dream button and status - no settings controls */
  compactMode?: boolean
  /** When true, only show settings controls - no Dream button */
  settingsOnly?: boolean
}


/**
 * CinemaDreamControls - Dream (Daydream StreamDiffusion) status and control button
 *
 * Displays Dream status indicators and provides the toggle button for
 * starting/stopping Dream mode.
 */
export function CinemaDreamControls({
  dreamStatus,
  dreamConfigured,
  webglContextLost,
  isVisualizerScene,
  onDreamToggle,
  onRetryDream,
  frameSize,
  onFrameSizeChange,
  framePosition,
  onFramePositionChange,
  presentation,
  onPresentationChange,
  onForceSync,
  isOverlayHidden,
  onOverlayHiddenChange,
  compactMode = false,
  settingsOnly = false,
}: CinemaDreamControlsProps) {
  const { shouldUseSidePanels } = useResponsivePanels()
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false)
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false)
  const [isPositionMenuOpen, setIsPositionMenuOpen] = useState(false)

  // Refs for click-away support
  const personaRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef<HTMLDivElement>(null)

  useClickAway(personaRef, () => setIsPersonaMenuOpen(false), { enabled: isPersonaMenuOpen })
  useClickAway(sizeRef, () => setIsSizeMenuOpen(false), { enabled: isSizeMenuOpen })
  useClickAway(positionRef, () => setIsPositionMenuOpen(false), { enabled: isPositionMenuOpen })

  // Auto-close menu on selection
  const handlePersonaSelect = (next: DaydreamPresentation) => {
    setIsPersonaMenuOpen(false)
    if (next === presentation) {
      onForceSync?.()
      return
    }
    onPresentationChange(next)
  }

  const handleSizeSelect = (size: "default" | "small") => {
    onFrameSizeChange(size)
    setIsSizeMenuOpen(false)
  }

  const handlePositionSelect = (position: "center" | "bottom-center" | "bottom-left" | "bottom-right" | "top" | "bottom") => {
    onFramePositionChange(position)
    setIsPositionMenuOpen(false)
  }

  // settingsOnly mode: only render settings controls
  if (settingsOnly) {
    const isDreamActive = dreamStatus.status === "streaming" || dreamStatus.status === "connecting"
    if (!isDreamActive) return null

    return (
      <div className="flex items-center gap-2 md:gap-2">
        {/* Persona Dropdown */}
        <div ref={personaRef} className="relative">
          <Button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            variant="secondary"
            size="sm"
            className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
            leftIcon={<User className="h-3 w-3" />}
            rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} />}
          >
            <span className="hidden sm:inline">
              Persona: {presentation === "androgynous" ? "Neutral" : presentation === "female" ? "Female" : "Male"}
            </span>
            <span className="sm:hidden">
              {presentation === "androgynous" ? "Neutral" : presentation === "female" ? "Female" : "Male"}
            </span>
          </Button>

          {isPersonaMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
              <Button onClick={() => handlePersonaSelect("androgynous")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "androgynous" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`}>Neutral</Button>
              <Button onClick={() => handlePersonaSelect("female")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "female" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`}>Female</Button>
              <Button onClick={() => handlePersonaSelect("male")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "male" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`}>Male</Button>
            </div>
          )}
        </div>

        {/* Position Dropdown - Desktop */}
        {shouldUseSidePanels && (
          <div ref={positionRef} className="relative">
            <Button onClick={() => setIsPositionMenuOpen(!isPositionMenuOpen)} variant="secondary" size="sm" className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md" rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isPositionMenuOpen ? 'rotate-180' : ''}`} />} leftIcon={<LayoutTemplate className="h-3 w-3" />}>Position</Button>
            {isPositionMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
                <Button onClick={() => handlePositionSelect("center")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "center" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<AlignCenter className="h-3 w-3" />}>Center</Button>
                <Button onClick={() => handlePositionSelect("bottom-left")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-left" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<ArrowDownLeft className="h-3 w-3" />}>Bottom Left</Button>
                <Button onClick={() => handlePositionSelect("bottom-right")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-right" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<ArrowDownRight className="h-3 w-3" />}>Bottom Right</Button>
                <Button onClick={() => handlePositionSelect("bottom-center")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-center" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<ArrowDown className="h-3 w-3" />}>Bottom Center</Button>
              </div>
            )}
          </div>
        )}

        {/* Size Dropdown */}
        {shouldUseSidePanels && (
          <div ref={sizeRef} className="relative">
            <Button onClick={() => setIsSizeMenuOpen(!isSizeMenuOpen)} variant="secondary" size="sm" className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md" rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />} leftIcon={<Monitor className="h-3 w-3" />}>
              <span className="hidden sm:inline">Size: {frameSize}</span>
            </Button>
            {isSizeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
                <Button onClick={() => handleSizeSelect("default")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${frameSize === "default" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<Maximize className="h-3 w-3" />}>Default</Button>
                <Button onClick={() => handleSizeSelect("small")} variant="ghost" className={`w-full justify-start px-3 py-2 text-xs h-auto ${frameSize === "small" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"}`} leftIcon={<Minimize className="h-3 w-3" />}>Small (50%)</Button>
              </div>
            )}
          </div>
        )}

        {/* Hide/Show Overlay Toggle */}
        <Button
          onClick={() => onOverlayHiddenChange(!isOverlayHidden)}
          variant="secondary"
          size="sm"
          className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
          leftIcon={isOverlayHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          title={isOverlayHidden ? "Show Dream overlay" : "Hide Dream overlay"}
        >
          <span className="hidden sm:inline">{isOverlayHidden ? "Show" : "Hide"}</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 md:gap-2">
      {/* Daydream Countdown Status - only show while countdown is active */}
      {/* Note: Must use explicit > 0 check, not truthiness - React renders 0 as "0" */}
      {!settingsOnly && dreamStatus.status !== "idle" && dreamStatus.status !== "error" && (dreamStatus.countdownRemaining ?? 0) > 0 && (
        <span className="flex items-center justify-center gap-1 md:gap-1.5 rounded-full bg-purple-500/40 border border-purple-500/50 px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.25em] text-white backdrop-blur-md whitespace-nowrap">
          <Hourglass className="h-2.5 w-2.5 md:h-3 md:w-3" />
          <span className="inline-block w-[2.5ch] text-right tabular-nums">{dreamStatus.countdownRemaining}s</span>
        </span>
      )}

      {/* Error state */}
      {!settingsOnly && dreamStatus.status === "error" && (
        <span className="flex items-center gap-1.5 md:gap-2 rounded-full bg-red-900/60 backdrop-blur-md border border-red-500/30 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-[11px] text-red-200 shadow-lg whitespace-nowrap">
          <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
          {dreamStatus.message || "Error"}
        </span>
      )}

      {/* Frame Controls (Only visible when Dream is active/streaming) - skip in compactMode */}
      {!compactMode && (dreamStatus.status === "streaming" || dreamStatus.status === "connecting") && (
        <>
          {/* Persona Dropdown (matches Size/Position styling) */}
          <div ref={personaRef} className="relative">
            <Button
              onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
              variant="secondary"
              size="sm"
              className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
              leftIcon={<User className="h-3 w-3" />}
              rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} />}
            >
              <span className="hidden sm:inline">
                Persona: {presentation === "androgynous" ? "Neutral" : presentation === "female" ? "Female" : "Male"}
              </span>
              <span className="sm:hidden">
                {presentation === "androgynous" ? "Neutral" : presentation === "female" ? "Female" : "Male"}
              </span>
            </Button>

            {isPersonaMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
                <Button
                  onClick={() => handlePersonaSelect("androgynous")}
                  variant="ghost"
                  className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "androgynous" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                    }`}
                >
                  Neutral
                </Button>
                <Button
                  onClick={() => handlePersonaSelect("female")}
                  variant="ghost"
                  className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "female" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                    }`}
                >
                  Female
                </Button>
                <Button
                  onClick={() => handlePersonaSelect("male")}
                  variant="ghost"
                  className={`w-full justify-start px-3 py-2 text-xs h-auto ${presentation === "male" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                    }`}
                >
                  Male
                </Button>
              </div>
            )}
          </div>

          {/* Position Dropdown (Desktop Only) */}
          {shouldUseSidePanels && (
            <div ref={positionRef} className="relative hidden md:block">
              <Button
                onClick={() => setIsPositionMenuOpen(!isPositionMenuOpen)}
                variant="secondary"
                size="sm"
                className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
                rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isPositionMenuOpen ? 'rotate-180' : ''}`} />}
                leftIcon={<LayoutTemplate className="h-3 w-3" />}
              >
                Position
              </Button>

              {isPositionMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
                  <Button
                    onClick={() => handlePositionSelect("center")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "center" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<AlignCenter className="h-3 w-3" />}
                  >
                    Center
                  </Button>
                  <Button
                    onClick={() => handlePositionSelect("bottom-left")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-left" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<ArrowDownLeft className="h-3 w-3" />}
                  >
                    Bottom Left
                  </Button>
                  <Button
                    onClick={() => handlePositionSelect("bottom-right")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-right" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<ArrowDownRight className="h-3 w-3" />}
                  >
                    Bottom Right
                  </Button>
                  <Button
                    onClick={() => handlePositionSelect("bottom-center")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${framePosition === "bottom-center" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<ArrowDown className="h-3 w-3" />}
                  >
                    Bottom Center
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Size Dropdown (Desktop Only) */}
          {shouldUseSidePanels && (
            <div ref={sizeRef} className="relative">
              <Button
                onClick={() => setIsSizeMenuOpen(!isSizeMenuOpen)}
                variant="secondary"
                size="sm"
                className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
                rightIcon={<ChevronDown className={`h-3 w-3 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />}
                leftIcon={<Monitor className="h-3 w-3" />}
              >
                <span className="hidden sm:inline">Size: {frameSize}</span>
              </Button>

              {isSizeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-(--border-elevated) bg-(--bg-surface-elevated)/95 backdrop-blur-xl shadow-xl z-50">
                  <Button
                    onClick={() => handleSizeSelect("default")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${frameSize === "default" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<Maximize className="h-3 w-3" />}
                  >
                    Default
                  </Button>
                  <Button
                    onClick={() => handleSizeSelect("small")}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-2 text-xs h-auto ${frameSize === "small" ? "bg-white/10 text-white" : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                      }`}
                    leftIcon={<Minimize className="h-3 w-3" />}
                  >
                    Small (50%)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Hide/Show Overlay Toggle */}
          <Button
            onClick={() => onOverlayHiddenChange(!isOverlayHidden)}
            variant="secondary"
            size="sm"
            className="gap-2 rounded-full border-white/30 bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-black/40 hover:border-white/50 backdrop-blur-md"
            leftIcon={isOverlayHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            title={isOverlayHidden ? "Show Dream overlay" : "Hide Dream overlay"}
          >
            <span className="hidden sm:inline">{isOverlayHidden ? "Show" : "Hide"}</span>
          </Button>
        </>
      )}

      {/* Dream button */}
      {webglContextLost && isVisualizerScene ? (
        <span className="rounded-full bg-amber-500/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-amber-300">
          GPU context lost
        </span>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={dreamStatus.status === "error" ? onRetryDream : onDreamToggle}
          disabled={dreamStatus.status !== "idle" && dreamStatus.status !== "error" && dreamStatus.status !== "streaming" && dreamStatus.status !== "connecting"}
          title={dreamConfigured === false ? "Set DAYDREAM_API_KEY on the server to enable Dream." : undefined}
          className={`gap-2 rounded-full border-white/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 ${dreamStatus.status === "streaming" || dreamStatus.status === "connecting"
            ? "bg-red-500/20 border-red-500/40 hover:bg-red-500/30"
            : "bg-black/50 hover:bg-black/40 hover:border-white/50"
            }`}
        >
          {dreamStatus.status === "idle" && (
            <>
              <Sparkles className="h-4 w-4" />
              Dream
            </>
          )}
          {(dreamStatus.status === "connecting" || dreamStatus.status === "streaming") && (
            <>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Stop
            </>
          )}
          {dreamStatus.status === "error" && (
            <>
              <Sparkles className="h-4 w-4 text-red-400" />
              Retry
            </>
          )}
        </Button>
      )}
    </div>
  )
}
