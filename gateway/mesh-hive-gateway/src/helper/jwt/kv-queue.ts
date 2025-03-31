interface KvQueueItem {
  key: string;
  value: string;
  options?: { expirationTtl?: number };
}

export class KvQueue {
  private queue: KvQueueItem[] = [];
  private readonly maxQueueSize: number;
  private readonly kvStorage: KVNamespace;

  constructor(kvStorage: KVNamespace, maxQueueSize = 50) {
    this.kvStorage = kvStorage;
    this.maxQueueSize = maxQueueSize;
  }

  push(key: string, value: string, options?: { expirationTtl?: number }) {
    this.queue.push({ key, value, options });

    if (this.queue.length >= this.maxQueueSize) {
      this.process();
    }
  }

  async process() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    await Promise.allSettled(batch.map((item) => this.kvStorage.put(item.key, item.value, item.options)));
  }
}
