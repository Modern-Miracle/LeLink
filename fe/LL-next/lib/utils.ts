import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HumanName } from './types/fhir';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function calculateAge(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? age - 1 : age;
}

export function getFullName(name?: HumanName[]): string {
  if (!name || name.length === 0) return 'Unknown';
  const n = name[0];
  return `${n.given?.join(' ') ?? ''} ${n.family ?? ''}`.trim();
}

export function getInitials(name?: HumanName[]): string {
  if (!name || name.length === 0) return '??';
  const n = name[0];
  const first = n.given?.[0]?.[0] ?? '';
  const last = n.family?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export const getStringFromBuffer = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * Calculates exponential backoff delay with jitter
 * @param baseDelay Initial delay in milliseconds
 * @param attempt Current attempt number (0-based)
 * @returns Delay in milliseconds
 */
export function exponentialBackoff(baseDelay: number, attempt: number): number {
  const maxDelay = 1000 * 60 * 5; // 5 minutes
  const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
  const jitter = Math.random() * 0.2 * exponential; // 20% jitter
  return Math.floor(exponential + jitter);
}
