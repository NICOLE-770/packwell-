import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Trip, SharedPayload } from "@/types";

export function buildShareUrl(trip: Trip): string {
  const payload: SharedPayload = {
    title: trip.title,
    categories: trip.categories,
    items: trip.items,
    exportedAt: Date.now(),
  };
  const data = compressToEncodedURIComponent(JSON.stringify(payload));
  return `${window.location.origin}/#/share?d=${data}`;
}

export function decodeShare(data: string | null): SharedPayload | null {
  if (!data) return null;
  try {
    const json = decompressFromEncodedURIComponent(data);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function exportPlainText(trip: Trip): string {
  let text = `${trip.title}\n${"=".repeat(40)}\n\n`;
  const sortedCats = [...trip.categories].sort((a, b) => a.order - b.order);
  for (const cat of sortedCats) {
    const items = trip.items.filter((i) => i.categoryId === cat.id);
    if (items.length === 0) continue;
    text += `【${cat.name}】\n`;
    for (const item of items) {
      const check = item.packed ? "[✓]" : "[ ]";
      const qty = item.quantity > 1 ? `×${item.quantity}` : "";
      const note = item.note ? ` （${item.note}）` : "";
      text += `  ${check} ${item.name}${qty}${note}\n`;
    }
    text += "\n";
  }
  text += `打包进度：${trip.items.filter((i) => i.packed).length}/${trip.items.length} 项\n`;
  return text;
}
