import test from "node:test";
import assert from "node:assert/strict";
import { CAPTURE_RETENTION_MS, savePendingCapture, loadPendingCapture, clearPendingCapture } from "../src/extension/capture-store.ts";

function createDatabase() {
  const records = new Map();
  const database = {
    objectStoreNames: { contains: () => true },
    close() {},
    transaction() {
      let pending = 0;
      const transaction = { objectStore: () => store };
      const enqueue = (run) => {
        const request = {};
        pending++;
        setImmediate(() => {
          request.result = run(request);
          request.onsuccess?.();
          pending--;
          setImmediate(() => { if (!pending) transaction.oncomplete?.(); });
        });
        return request;
      };
      const store = {
        put(record) { return enqueue(() => records.set(record.id, structuredClone(record))); },
        get(id) { return enqueue(() => records.has(id) ? structuredClone(records.get(id)) : undefined); },
        delete(id) { return enqueue(() => records.delete(id)); },
        openCursor() {
          const keys = [...records.keys()];
          const request = {};
          const advance = () => {
            pending++;
            setImmediate(() => {
              const key = keys.shift();
              request.result = key === undefined ? null : {
                value: records.get(key),
                delete: () => store.delete(key),
                continue: advance,
              };
              request.onsuccess?.();
              pending--;
              setImmediate(() => { if (!pending) transaction.oncomplete?.(); });
            });
          };
          advance();
          return request;
        },
      };
      return transaction;
    },
  };
  return {
    records,
    open() {
      const request = {};
      setImmediate(() => { request.result = database; request.onsuccess?.(); });
      return request;
    },
  };
}

function useDatabase(t) {
  const previous = globalThis.indexedDB;
  const database = createDatabase();
  globalThis.indexedDB = database;
  t.after(() => { globalThis.indexedDB = previous; });
  return database;
}

test("independent capture previews retain their own images and clear only their own record", async (t) => {
  useDatabase(t);
  const first = await savePendingCapture({ type: "single", dataUrl: "first image" });
  const second = await savePendingCapture({ type: "single", dataUrl: "second image" });
  assert.notEqual(first, second);
  assert.equal((await loadPendingCapture(first)).dataUrl, "first image");
  assert.equal((await loadPendingCapture(second)).dataUrl, "second image");
  await clearPendingCapture(first);
  assert.equal(await loadPendingCapture(first), null);
  assert.equal((await loadPendingCapture(second)).dataUrl, "second image");
});

test("loading a preview does not consume it, so a page reload can recover the capture", async (t) => {
  useDatabase(t);
  const id = await savePendingCapture({ type: "single", dataUrl: "reusable image" });
  assert.deepEqual(await loadPendingCapture(id), await loadPendingCapture(id));
  assert.equal(await loadPendingCapture("unknown"), null);
});

test("expired capture data is purged while current capture data survives", async (t) => {
  const database = useDatabase(t);
  database.records.set("expired", { id: "expired", createdAt: Date.now() - CAPTURE_RETENTION_MS - 1, dataUrl: "old" });
  database.records.set("legacy", { id: "legacy", dataUrl: "no timestamp" });
  const id = await savePendingCapture({ dataUrl: "new" });
  assert.equal(await loadPendingCapture("expired"), null);
  assert.equal(database.records.has("expired"), false);
  assert.equal(database.records.has("legacy"), false);
  assert.equal((await loadPendingCapture(id)).dataUrl, "new");
});
