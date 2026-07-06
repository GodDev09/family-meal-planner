import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WEEKDAYS_VI = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${WEEKDAYS_VI[d.getDay()]}, ${day}/${month}/${year}`;
}

export function getWeekdayVi(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAYS_VI[d.getDay()];
}

export function getWeekStart(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatNutrient(value: number, unit: string): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k${unit}`;
  if (value < 1) return `${(value * 1000).toFixed(0)}m${unit}`;
  return `${Math.round(value)}${unit}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(-2)
    .join("");
}

export function generateId(prefix = ""): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return prefix ? `${prefix}_${id}` : id;
}
