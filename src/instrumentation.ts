/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js during server startup.
 * Used for one-time initialization tasks like pre-warming caches.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Pre-warm knowledge embeddings to avoid cold-start latency on first user query
    const { warmupKnowledgeEmbeddings } = await import('@/lib/ai/tools')
    await warmupKnowledgeEmbeddings()
  }
}
