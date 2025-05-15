import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HumanName } from "./types/fhir";

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
  if (!name || name.length === 0) return "Unknown";
  const n = name[0];
  return `${n.given?.join(" ") ?? ""} ${n.family ?? ""}`.trim();
}

export function getInitials(name?: HumanName[]): string {
  if (!name || name.length === 0) return "??";
  const n = name[0];
  const first = n.given?.[0]?.[0] ?? "";
  const last = n.family?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
