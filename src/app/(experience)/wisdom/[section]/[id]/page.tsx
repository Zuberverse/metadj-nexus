import wisdomData from "@/data/wisdom-content.json"
import { getAppBaseUrl } from "@/lib/app-url"
import { buildWisdomDeepLinkPath, type WisdomSection } from "@/lib/wisdom"
import type { Metadata } from "next"

const wisdomRobots = {
  index: false,
  follow: true,
}

function isWisdomSection(value: string): value is WisdomSection {
  return value === "thoughts" || value === "guides" || value === "reflections"
}

function getWisdomItem(section: WisdomSection, id: string) {
  if (section === "thoughts") {
    return wisdomData.thoughtsPosts.find((post) => post.id === id)
  }

  if (section === "guides") {
    return wisdomData.guides.find((guide) => guide.id === id)
  }

  return wisdomData.reflections.find((reflection) => reflection.id === id)
}

export async function generateMetadata({
  params,
}: {
  params: { section: string; id: string }
}): Promise<Metadata> {
  const { section, id } = params

  if (!isWisdomSection(section)) {
    return {
      title: "Wisdom — MetaDJ Nexus",
      description: "Thoughts, guides, and reflections from MetaDJ.",
      robots: wisdomRobots,
    }
  }

  const item = getWisdomItem(section, id)
  if (!item) {
    return {
      title: "Wisdom — MetaDJ Nexus",
      description: "Thoughts, guides, and reflections from MetaDJ.",
      robots: wisdomRobots,
    }
  }

  const baseUrl = getAppBaseUrl()
  const url = `${baseUrl}${buildWisdomDeepLinkPath(section, id)}`
  const title = `${item.title} — MetaDJ Wisdom`
  const description = item.excerpt

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: wisdomRobots,
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
  }
}

export default function WisdomDeepLinkPage() {
  return null
}
