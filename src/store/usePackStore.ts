import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, Item, Trip } from "@/types";

const STORAGE_KEY = "packwell-store";

function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultCategories(): Category[] {
  return [
    { id: uid("cat"), name: "证件财物", icon: "Wallet", order: 0 },
    { id: uid("cat"), name: "衣物", icon: "Shirt", order: 1 },
    { id: uid("cat"), name: "洗漱护理", icon: "Droplets", order: 2 },
    { id: uid("cat"), name: "电子设备", icon: "Plug", order: 3 },
    { id: uid("cat"), name: "药品急救", icon: "Pill", order: 4 },
    { id: uid("cat"), name: "其他", icon: "Package", order: 5 },
  ];
}

function emptyTrip(title = "我的旅行清单"): Trip {
  const now = Date.now();
  return {
    id: uid("trip"),
    title,
    createdAt: now,
    updatedAt: now,
    categories: defaultCategories(),
    items: [],
  };
}

function exampleTrip(): Trip {
  const now = Date.now();
  const cats = defaultCategories();
  const items: Item[] = [
    { id: uid("i"), categoryId: cats[0].id, name: "护照/身份证", quantity: 1, packed: false, order: 0 },
    { id: uid("i"), categoryId: cats[0].id, name: "现金", quantity: 1, note: "小额零钱", packed: false, order: 1 },
    { id: uid("i"), categoryId: cats[1].id, name: "内衣", quantity: 7, packed: false, order: 0 },
    { id: uid("i"), categoryId: cats[1].id, name: "外套", quantity: 1, packed: false, order: 1 },
    { id: uid("i"), categoryId: cats[2].id, name: "牙刷/牙膏", quantity: 1, packed: false, order: 0 },
    { id: uid("i"), categoryId: cats[3].id, name: "充电宝", quantity: 1, note: "≤100Wh", packed: false, order: 0 },
    { id: uid("i"), categoryId: cats[3].id, name: "充电线", quantity: 2, packed: false, order: 1 },
    { id: uid("i"), categoryId: cats[4].id, name: "常备药", quantity: 1, packed: false, order: 0 },
  ];
  return { id: uid("trip"), title: "京都七日行", createdAt: now, updatedAt: now, categories: cats, items };
}

function touch(trip: Trip): Trip {
  return { ...trip, updatedAt: Date.now() };
}

function importTrip(data: { title: string; categories: Category[]; items: Item[] }): Trip {
  const now = Date.now();
  const catIdMap: Record<string, string> = {};
  const categories = data.categories.map((c) => {
    const newId = uid("cat");
    catIdMap[c.id] = newId;
    return { ...c, id: newId };
  });
  const items = data.items.map((it, idx) => ({
    ...it,
    id: uid("i"),
    categoryId: catIdMap[it.categoryId] ?? it.categoryId,
    packed: false,
    order: idx,
  }));
  return { id: uid("trip"), title: data.title, createdAt: now, updatedAt: now, categories, items };
}

interface PackState {
  trips: Trip[];
  currentTripId: string | null;
  initialized: boolean;
  currentTrip: () => Trip | null;
  initIfEmpty: () => void;
  createTrip: (title?: string) => string;
  createExampleTrip: () => string;
  switchTrip: (id: string) => void;
  renameTrip: (id: string, title: string) => void;
  duplicateTrip: (id: string, newTitle?: string) => string;
  deleteTrip: (id: string) => void;
  importFromPayload: (data: { title: string; categories: Category[]; items: Item[] }) => string;
  setTitle: (title: string) => void;
  clearItems: () => void;
  addItem: (data: Omit<Item, "id" | "order" | "packed">) => void;
  updateItem: (id: string, patch: Partial<Omit<Item, "id">>) => void;
  removeItem: (id: string) => void;
  togglePacked: (id: string) => void;
  addCategory: (name: string, icon: string) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  removeCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
}

export const usePackStore = create<PackState>()(
  persist(
    (set, get) => ({
      trips: [],
      currentTripId: null,
      initialized: false,
      currentTrip: () => get().trips.find((t) => t.id === get().currentTripId) ?? null,
      initIfEmpty: () => {
        if (!get().initialized || get().trips.length === 0) {
          const trip = exampleTrip();
          set({ trips: [trip], currentTripId: trip.id, initialized: true });
        }
      },
      createTrip: (title) => {
        const trip = emptyTrip(title);
        set((s) => ({ trips: [...s.trips, trip], currentTripId: trip.id }));
        return trip.id;
      },
      createExampleTrip: () => {
        const trip = exampleTrip();
        set((s) => ({ trips: [...s.trips, trip], currentTripId: trip.id }));
        return trip.id;
      },
      switchTrip: (id) => set({ currentTripId: id }),
      renameTrip: (id, title) => set((s) => ({
        trips: s.trips.map((t) => t.id === id ? touch({ ...t, title }) : t),
      })),
      duplicateTrip: (id, newTitle) => {
        const source = get().trips.find((t) => t.id === id);
        if (!source) return "";
        const dup = importTrip({ title: newTitle ?? `${source.title}（副本）`, categories: source.categories, items: source.items });
        set((s) => ({ trips: [...s.trips, dup], currentTripId: dup.id }));
        return dup.id;
      },
      deleteTrip: (id) => set((s) => {
        const remaining = s.trips.filter((t) => t.id !== id);
        if (remaining.length === 0) {
          const fresh = emptyTrip();
          return { trips: [fresh], currentTripId: fresh.id };
        }
        return { trips: remaining, currentTripId: s.currentTripId === id ? remaining[0].id : s.currentTripId };
      }),
      importFromPayload: (data) => {
        const trip = importTrip(data);
        set((s) => ({ trips: [...s.trips, trip], currentTripId: trip.id }));
        return trip.id;
      },
      setTitle: (title) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trips = [...s.trips];
        trips[idx] = touch({ ...trips[idx], title });
        return { trips };
      }),
      clearItems: () => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trips = [...s.trips];
        trips[idx] = touch({ ...trips[idx], items: [] });
        return { trips };
      }),
      addItem: (data) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const order = trip.items.filter((i) => i.categoryId === data.categoryId).reduce((m, i) => Math.max(m, i.order), -1) + 1;
        const item: Item = { id: uid("i"), order, packed: false, ...data };
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, items: [...trip.items, item] });
        return { trips };
      }),
      updateItem: (id, patch) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, items: trip.items.map((i) => i.id === id ? { ...i, ...patch } : i) });
        return { trips };
      }),
      removeItem: (id) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, items: trip.items.filter((i) => i.id !== id) });
        return { trips };
      }),
      togglePacked: (id) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, items: trip.items.map((i) => i.id === id ? { ...i, packed: !i.packed } : i) });
        return { trips };
      }),
      addCategory: (name, icon) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const order = trip.categories.reduce((m, c) => Math.max(m, c.order), -1) + 1;
        const cat: Category = { id: uid("cat"), name, icon, order };
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, categories: [...trip.categories, cat] });
        return { trips };
      }),
      updateCategory: (id, patch) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, categories: trip.categories.map((c) => c.id === id ? { ...c, ...patch } : c) });
        return { trips };
      }),
      removeCategory: (id) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const trips = [...s.trips];
        trips[idx] = touch({
          ...trip,
          categories: trip.categories.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })),
          items: trip.items.filter((i) => i.categoryId !== id),
        });
        return { trips };
      }),
      moveCategory: (id, direction) => set((s) => {
        const idx = s.trips.findIndex((t) => t.id === s.currentTripId);
        if (idx === -1) return s;
        const trip = s.trips[idx];
        const sorted = [...trip.categories].sort((a, b) => a.order - b.order);
        const ci = sorted.findIndex((c) => c.id === id);
        if (ci === -1) return s;
        const target = ci + direction;
        if (target < 0 || target >= sorted.length) return s;
        [sorted[ci], sorted[target]] = [sorted[target], sorted[ci]];
        const reindexed = sorted.map((c, i) => ({ ...c, order: i }));
        const trips = [...s.trips];
        trips[idx] = touch({ ...trip, categories: reindexed });
        return { trips };
      }),
    }),
    { name: STORAGE_KEY, partialize: (s) => ({ trips: s.trips, currentTripId: s.currentTripId, initialized: s.initialized }) }
  )
);
