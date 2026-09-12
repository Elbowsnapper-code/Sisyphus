const DB = "sisyphus-state";
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let writeTimer: ReturnType<typeof setTimeout> | 0 = 0;
let pending: { name: string; value: string } | null = null;

export const idbPersistStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof indexedDB === "undefined") {
      return typeof localStorage === "undefined" ? null : localStorage.getItem(name);
    }
    try {
      const fromIdb = await idbGet(name);
      if (fromIdb != null) return fromIdb;
      if (typeof localStorage !== "undefined") {
        const legacy = localStorage.getItem(name);
        if (legacy) {
          await idbSet(name, legacy);
          return legacy;
        }
      }
      return null;
    } catch {
      return typeof localStorage === "undefined" ? null : localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    pending = { name, value };
    if (writeTimer) return;
    writeTimer = (typeof window !== "undefined" ? window.setTimeout : setTimeout)(async () => {
      writeTimer = 0;
      const job = pending;
      pending = null;
      if (!job) return;
      try {
        if (typeof indexedDB !== "undefined") await idbSet(job.name, job.value);
        else if (typeof localStorage !== "undefined") localStorage.setItem(job.name, job.value);
      } catch {
        try {
          localStorage.setItem(job.name, job.value);
        } catch {
          /* quota */
        }
      }
    }, 400);
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof indexedDB !== "undefined") await idbDel(name);
    } catch {
      /* ignore */
    }
    if (typeof localStorage !== "undefined") localStorage.removeItem(name);
  },
};
