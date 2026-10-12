const DATABASE_NAME = "temoto-captures";
const STORE_NAME = "captures";
export const CAPTURE_RETENTION_MS = 60 * 60 * 1000;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Capture storage request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Capture storage transaction failed"));
    transaction.onabort = () => reject(transaction.error || new Error("Capture storage transaction was aborted"));
  });
}

async function openCaptureDatabase() {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  };
  return requestResult(request);
}

function purgeExpiredCaptures(store: IDBObjectStore, now: number): void {
  const request = store.openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    const createdAt = Number(cursor.value.createdAt);
    if (!Number.isFinite(createdAt) || createdAt <= now - CAPTURE_RETENTION_MS) cursor.delete();
    cursor.continue();
  };
}

export async function savePendingCapture(capture: Record<string, unknown>): Promise<string> {
  const database = await openCaptureDatabase();
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionDone(transaction);
    const store = transaction.objectStore(STORE_NAME);
    purgeExpiredCaptures(store, createdAt);
    store.put({ ...capture, id, createdAt });
    await done;
    return id;
  } finally {
    database.close();
  }
}

export async function loadPendingCapture(id: string): Promise<Record<string, unknown> | null> {
  if (!id) return null;
  const database = await openCaptureDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionDone(transaction);
    const store = transaction.objectStore(STORE_NAME);
    const now = Date.now();
    purgeExpiredCaptures(store, now);
    const capture = await requestResult(store.get(id));
    await done;
    return capture && Number(capture.createdAt) > now - CAPTURE_RETENTION_MS ? capture : null;
  } finally {
    database.close();
  }
}

export async function clearPendingCapture(id: string): Promise<void> {
  if (!id) return;
  const database = await openCaptureDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(STORE_NAME).delete(id);
    await done;
  } finally {
    database.close();
  }
}
