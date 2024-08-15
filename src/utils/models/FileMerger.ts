export interface FileMeta {
  name: string;
  size: number;
  mime: string;
}

export default class FileMerger {
  private chunks: ArrayBuffer[] = [];

  private bytesReceived = 0;

  constructor(private meta: FileMeta) {}

  receive(chunk: ArrayBuffer) {
    const size = this.bytesReceived + chunk.byteLength;
    const progress = size / this.meta.size;
    const isReceiveEnd = size >= this.meta.size;

    if (isReceiveEnd) {
      return;
    }

    this.chunks.push(chunk);
    this.bytesReceived = size;
  }

  merge() {
    return new Blob(this.chunks, { type: this.meta.mime });
  }
}
