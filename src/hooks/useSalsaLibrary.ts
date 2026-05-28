import { useState, useEffect } from "react";
import type { LibraryEntry } from "@/components/salsa/LibraryItem";

const STORAGE_KEY = "salsa_library";

function load(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: LibraryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useSalsaLibrary() {
  const [userItems, setUserItems] = useState<LibraryEntry[]>(load);

  useEffect(() => {
    save(userItems);
  }, [userItems]);

  function addItem(item: Omit<LibraryEntry, "id" | "addedAt">) {
    const newItem: LibraryEntry = {
      ...item,
      id: crypto.randomUUID(),
      addedAt: "Just now",
    };
    setUserItems((prev) => [newItem, ...prev]);
    return newItem;
  }

  function removeItem(id: string) {
    setUserItems((prev) => prev.filter((i) => i.id !== id));
  }

  return { userItems, addItem, removeItem };
}
