"use client";

// app/lib/product-cache.ts
//
// Thin IndexedDB wrapper for offline product caching.
// Supabase remains the primary database — this is a read-only offline cache.
// Never stores auth tokens, session data, or private customer information.

const DB_NAME    = "s2g-product-cache";
const DB_VERSION = 1;
const STORE_NAME = "products";

// Shape stored per product — public catalogue fields only
export type CachedProduct = {
  id: number;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  collections: string[];
  featured: boolean;
  condition: string;
  sizes: string[];
  image: string;
  gallery: string[];
  description: string;
  stock: number;
  badge?: string;
  // When this record was last written from a live Supabase response
  cachedAt: number;
};

// Input type for saveProducts — cachedAt is added internally, optional fields match API response
type SaveableProduct = {
  id: number;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  collections?: string[];
  featured?: boolean;
  condition: string;
  sizes: string[];
  image: string;
  gallery?: string[];
  description?: string;
  stock: number;
  badge?: string;
};

// ─── DB connection (module-level singleton) ───────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // keyPath = id (numeric product ID from Supabase)
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => {
      dbPromise = null; // allow retry on next call
      reject(request.error);
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error("IndexedDB open was blocked"));
    };
  });

  return dbPromise;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save an array of products to IndexedDB.
 * Uses put() so existing records are updated, not duplicated.
 * Silently ignores errors — the app works fine without the cache.
 */
export async function saveProducts(products: SaveableProduct[]): Promise<void> {
  if (!products.length) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const product of products) {
        store.put({
          ...product,
          collections: product.collections ?? [],
          featured: product.featured ?? false,
          gallery: product.gallery ?? [],
          description: product.description ?? "",
          cachedAt: Date.now(),
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {
    // Non-fatal — offline cache is best-effort
  }
}

/**
 * Read all cached products that belong to a given collection.
 * Returns an empty array on any error.
 */
export async function getCachedProductsByCollection(
  collection: string,
): Promise<CachedProduct[]> {
  try {
    const db = await openDB();
    return await new Promise<CachedProduct[]>((resolve, reject) => {
      const tx      = db.transaction(STORE_NAME, "readonly");
      const store   = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result as CachedProduct[]) ?? [];
        resolve(all.filter((p) => Array.isArray(p.collections) && p.collections.includes(collection)));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Read a single cached product by its numeric ID.
 * Returns null if not found or on any error.
 */
export async function getCachedProduct(id: number): Promise<CachedProduct | null> {
  try {
    const db = await openDB();
    return await new Promise<CachedProduct | null>((resolve, reject) => {
      const tx      = db.transaction(STORE_NAME, "readonly");
      const store   = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as CachedProduct) ?? null);
      request.onerror   = () => reject(request.error);
    });
  } catch {
    return null;
  }
}
