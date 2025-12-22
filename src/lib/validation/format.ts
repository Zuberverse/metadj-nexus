/**
 * Zod Error Formatting Utilities
 *
 * Centralized utilities for formatting Zod validation errors.
 * Provides consistent error formatting across the application.
 */

import type { ZodError } from 'zod';

/**
 * Format Zod error as an array of field/message objects
 * Useful for API responses and form validation
 *
 * @param error - Zod validation error
 * @returns Array of {field, message} objects
 *
 * @example
 * const errors = formatZodError(zodError);
 * // [{ field: "email", message: "Invalid email" }, ...]
 */
export function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'payload',
    message: issue.message,
  }));
}

/**
 * Format Zod error as a single string
 * Useful for error messages and logging
 *
 * @param error - Zod validation error
 * @param separator - Separator between issues (default: ', ')
 * @returns Formatted error string
 *
 * @example
 * const message = formatZodErrorString(zodError);
 * // "email: Invalid email, name: Required"
 */
export function formatZodErrorString(error: ZodError, separator = ', '): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(separator);
}
