export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  quantity: number;
  note?: string;
  packed: boolean;
  order: number;
}

export interface Trip {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  categories: Category[];
  items: Item[];
}

export interface SharedPayload {
  title: string;
  categories: Category[];
  items: Item[];
  exportedAt: number;
}

export type DraftItem = Omit<Item, "id" | "order" | "packed">;
