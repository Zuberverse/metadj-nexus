"use client"

import { type FC } from "react"
import clsx from "clsx"
import type { ReadTimeBucket } from "@/lib/wisdom"

export type ReadTimeFilter = "all" | ReadTimeBucket

interface WisdomFiltersProps {
  topics: string[]
  selectedTopic: string
  selectedLength: ReadTimeFilter
  onTopicChange: (value: string) => void
  onLengthChange: (value: ReadTimeFilter) => void
  onReset?: () => void
}

const LENGTH_OPTIONS: Array<{ value: ReadTimeFilter; label: string }> = [
  { value: "all", label: "All lengths" },
  { value: "short", label: "Short (1-3 min)" },
  { value: "medium", label: "Medium (4-7 min)" },
  { value: "long", label: "Long (8+ min)" },
]

export const WisdomFilters: FC<WisdomFiltersProps> = ({
  topics,
  selectedTopic,
  selectedLength,
  onTopicChange,
  onLengthChange,
  onReset,
}) => {
  const isFiltered = selectedTopic !== "all" || selectedLength !== "all"

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-white/70">
          Topic
          <select
            value={selectedTopic}
            onChange={(event) => onTopicChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white/90 focus-ring"
          >
            <option value="all">All topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-white/70">
          Length
          <select
            value={selectedLength}
            onChange={(event) => onLengthChange(event.target.value as ReadTimeFilter)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white/90 focus-ring"
          >
            {LENGTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className={clsx(
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
            isFiltered
              ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300/70 hover:bg-cyan-500/20"
              : "border-white/10 bg-white/5 text-white/50 cursor-default"
          )}
          disabled={!isFiltered}
        >
          Reset
        </button>
      )}
    </div>
  )
}
