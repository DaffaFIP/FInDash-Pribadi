const STORAGE_KEY = "findash_offline_queue";

function getQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setQueue(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function addToQueue(item) {
  const queue = getQueue();
  queue.push(item);
  setQueue(queue);
}

function removeFromQueue(id) {
  const queue = getQueue().filter((i) => i.id !== id);
  setQueue(queue);
}

function updateQueueItem(id, changes) {
  const queue = getQueue().map((i) =>
    i.id === id ? { ...i, ...changes } : i
  );
  setQueue(queue);
}

function getPendingCount() {
  return getQueue().filter(
    (i) => i.status === "pending" || i.status === "syncing"
  ).length;
}

export { getQueue, addToQueue, removeFromQueue, updateQueueItem, getPendingCount };
