import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

interface SalsaLibraryContextType {
  userItems: LibraryEntry[];
  addItem: (item: Omit<LibraryEntry, "id" | "addedAt">) => LibraryEntry;
  removeItem: (id: string) => void;
}

const SalsaLibraryContext = createContext<SalsaLibraryContextType | null>(null);

export function SalsaLibraryProvider({ children }: { children: ReactNode }) {
  const [userItems, setUserItems] = useState<LibraryEntry[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userItems));
  }, [userItems]);

  function addItem(item: Omit<LibraryEntry, "id" | "addedAt">): LibraryEntry {
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

  return (
    <SalsaLibraryContext.Provider value={{ userItems, addItem, removeItem }}>
      {children}
    </SalsaLibraryContext.Provider>
  );
}

export function useSalsaLibrary() {
  const ctx = useContext(SalsaLibraryContext);
  if (!ctx) throw new Error("useSalsaLibrary must be used inside SalsaLibraryProvider");
  return ctx;
}
