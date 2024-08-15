interface EventMap {
  progress: MessageEvent<number>;
  chunk: MessageEvent<ArrayBuffer>;
  start: Event;
  end: Event;
  error: MessageEvent<Error>;
}

export default class FileSplitter {
  private eventTarget = new EventTarget();
  constructor(private file: File, private chunkSize = 64000) {}

  async split() {
    try {
      let offset = 0;

      this.eventTarget.dispatchEvent(new Event("start"));

      while (offset < this.file.size) {
        const chunk = this.file.slice(offset, offset + this.chunkSize);
        const buffer = await this.readChunkAsArrayBuffer(chunk);

        offset += buffer.byteLength;
        const progress = offset / this.file.size;

        this.eventTarget.dispatchEvent(
          new MessageEvent("progress", { data: progress })
        );
        this.eventTarget.dispatchEvent(
          new MessageEvent("chunk", { data: buffer })
        );
      }

      this.eventTarget.dispatchEvent(new Event("end"));
    } catch (error) {
      this.eventTarget.dispatchEvent(
        new MessageEvent("error", { data: error as Error })
      );
    }
  }

  private readChunkAsArrayBuffer(chunk: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e.target?.error);
      reader.readAsArrayBuffer(chunk);
    });
  }

  addEventListener<T extends keyof EventMap>(
    type: T,
    listener: (event: EventMap[T]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventTarget.addEventListener(type, listener as EventListener, options);
  }

  removeEventListener<T extends keyof EventMap>(
    type: T,
    listener: (event: EventMap[T]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventTarget.removeEventListener(
      type,
      listener as EventListener,
      options
    );
  }
}
