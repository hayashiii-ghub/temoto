const DATABASE_NAME = "temoto-captures";
const STORE_NAME = "captures";
const PENDING_CAPTURE_ID = "pending";

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

export async function savePendingCapture(capture: Record<string, unknown>): Promise<void> {
  const database = await openCaptureDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ ...capture, id: PENDING_CAPTURE_ID });
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function readPendingCapture(): Promise<Record<string, unknown> | null> {
  const database = await openCaptureDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const capture = await requestResult(transaction.objectStore(STORE_NAME).get(PENDING_CAPTURE_ID));
    await transactionDone(transaction);
    return capture || null;
  } finally {
    database.close();
  }
}

export async function removePendingCapture(): Promise<void> {
  const database = await openCaptureDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(PENDING_CAPTURE_ID);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
