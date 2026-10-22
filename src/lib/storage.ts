import type { TierBoard } from "@/types/tier-list";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("nww-tier-list", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("boards");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Browser storage is blocked."));
  });
}

export async function loadBoard(): Promise<TierBoard | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction("boards", "readonly").objectStore("boards").get("current");
      request.onsuccess = () => {
        const value = request.result as TierBoard | undefined;
        if (!value) return resolve(null);
        if (value.version !== 1 || !Array.isArray(value.tiers) || !Array.isArray(value.images) || !Array.isArray(value.unranked) || !value.tiers.length) {
          reject(new Error("The saved board could not be read."));
          return;
        }
        resolve(value);
      };
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveBoard(board: TierBoard): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("boards", "readwrite");
      transaction.objectStore("boards").put(board, "current");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}