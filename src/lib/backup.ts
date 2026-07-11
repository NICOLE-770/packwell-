import type { Trip } from "@/types";

export function downloadBackup(trip: Trip): void {
  const backup = {
    version: 1,
    exportedAt: Date.now(),
    trip: { title: trip.title, categories: trip.categories, items: trip.items },
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `packwell-${trip.title}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): { title: string; categories: any[]; items: any[] } | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed.version === 1 && parsed.trip) {
      return parsed.trip;
    }
    if (parsed.title && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
