import { getEnv } from '@/lib/env';

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return 'https://metadj.ai';
  }
}

export function getAppBaseUrl(): string {
  const env = getEnv();
  return normalizeOrigin(env.NEXT_PUBLIC_APP_URL || 'https://metadj.ai');
}

export function getPreviewBaseUrl(): string | undefined {
  const preview =
    process.env.NEXT_PUBLIC_PREVIEW_URL ||
    process.env.REPLIT_APP_URL ||
    undefined;

  return preview ? normalizeOrigin(preview) : undefined;
}
