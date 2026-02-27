// Nova Email Employee — Shared utilities

import type { EmailStatus } from "@/types/nova";

// ── Status Colors (violet theme) ────────────────────────────────────────────
export const emailStatusColors: Record<EmailStatus, string> = {
  queued: "hsl(240, 5%, 50%)",
  sending: "hsl(270, 80%, 65%)",
  delivered: "hsl(210, 80%, 60%)",
  opened: "hsl(160, 70%, 45%)",
  clicked: "hsl(45, 90%, 55%)",
  replied: "hsl(140, 70%, 45%)",
  bounced: "hsl(0, 80%, 55%)",
  failed: "hsl(0, 60%, 40%)",
};

export const emailStatusLabels: Record<EmailStatus, string> = {
  queued: "Queued",
  sending: "Sending",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  replied: "Replied",
  bounced: "Bounced",
  failed: "Failed",
};

// ── Time Formatting ─────────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Template Variable Extraction ────────────────────────────────────────────
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

// ── Formatting Helpers ──────────────────────────────────────────────────────
export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}
