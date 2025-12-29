"use client"

import { type FC } from "react"
import { List } from "lucide-react"

interface TableOfContentsProps {
  sections: { heading: string }[]
  /** Accent color class for the indicator (defaults to cyan) */
  accentClass?: string
}

/**
 * Table of contents navigation for multi-section content.
 * Displays section headings as clickable anchors.
 */
export const TableOfContents: FC<TableOfContentsProps> = ({
  sections,
  accentClass = "text-cyan-400"
}) => {
  // Generate slug from heading for anchor links
  const toSlug = (heading: string): string => {
    return heading
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
  }

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(slug)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (sections.length < 2) return null

  return (
    <nav className="rounded-xl border border-(--border-subtle) bg-black/30 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <List className={`h-4 w-4 ${accentClass}`} />
        <span className="text-xs font-heading font-semibold uppercase tracking-wider text-heading-solid">
          Contents
        </span>
      </div>
      <ol className="space-y-2">
        {sections.map((section, index) => (
          <li key={index}>
            <button
              onClick={() => scrollToSection(toSlug(section.heading))}
              className="text-sm text-white/70 hover:text-white transition-colors text-left w-full truncate"
            >
              <span className={`${accentClass} mr-2`}>{index + 1}.</span>
              {section.heading}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
