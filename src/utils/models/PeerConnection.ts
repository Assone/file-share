import { isObject, isString } from "../is";

interface EventMap<Message> {
  message: MessageEvent<Message>;
  status: MessageEvent<RTCPeerConnectionState>;
}

interface PeerConnectionOptions {
  receiver?: boolean;
}

export default class PeerConnection<Message = unknown> {
  connection?: RTCPeerConnection;
  channel?: RTCDataChannel;
  private messages: Message[] = [];
  private maxBufferedAmount = 64 * 1024;
  private receiver: boolean;
  private eventTarget = new EventTarget();

  constructor(options: PeerConnectionOptions = { receiver: false }) {
    this.receiver = options.receiver || false;

    this.connect();
  }

  connect() {
    this.connection = new RTCPeerConnection();

    this.connection.addEventListener(
      "connectionstatechange",
      this.onConnectionStateChange
    );
    this.connection.addEventListener(
      "icecandidateerror",
      this.onIceCandidateError
    );

    if (this.receiver) {
      this.connection.addEventListener("datachannel", (event) => {
        this.createChannel(event.channel);
      });
    } else {
      this.createChannel(
        this.connection.createDataChannel("data-channel", { ordered: true })
      );
    }
  }

  close() {
    this.connection?.removeEventListener(
      "connectionstatechange",
      this.onConnectionStateChange
    );
    this.connection?.removeEventListener(
      "icecandidateerror",
      this.onIceCandidateError
    );
    this.channel?.close();
    this.connection?.close();
  }

  private onConnectionStateChange = () => {
    const status: RTCPeerConnectionState[] = [
      "closed",
      "disconnected",
      "failed",
    ];

    this.eventTarget.dispatchEvent(
      new MessageEvent("status", { data: status })
    );

    if (status.includes(this.connection?.connectionState || "failed")) {
      this.connection?.close();
    }
  };

  private onIceCandidateError = () => {
    if (this.connection?.iceConnectionState === "failed") {
      this.connection.restartIce();
    }
  };

  private createChannel(datachannel: RTCDataChannel) {
    this.channel = datachannel;

    this.channel.addEventListener("message", ({ data }) => {
      const message = isString(data) ? JSON.parse(data) : data;

      this.eventTarget.dispatchEvent(
        new MessageEvent("message", { data: message })
      );
    });

    this.channel.addEventListener("open", this.flush);
    this.channel.addEventListener("bufferedamountlow", this.flush);
  }

  addEventListener<T extends keyof EventMap<Message>>(
    type: T,
    listener: (event: EventMap<Message>[T]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventTarget.addEventListener(
      type as string,
      listener as EventListener,
      options
    );
  }

  removeEventListener<T extends keyof EventMap<Message>>(
    type: T,
    listener: (event: EventMap<Message>[T]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventTarget.removeEventListener(
      type as string,
      listener as EventListener,
      options
    );
  }

  private get isBufferFull() {
    if (!this.channel) return false;

    return this.channel.bufferedAmount >= this.maxBufferedAmount;
  }

  send(message: Message) {
    if (this.channel?.readyState === "open" && this.isBufferFull === false) {
      const data = isObject(message) ? JSON.stringify(message) : message;

      this.channel.send(data as string);
    } else {
      this.messages.push(message);
    }
  }

  private flush = () => {
    while (this.messages.length > 0 && this.isBufferFull === false) {
      const message = this.messages.shift();

      if (message) {
        this.send(message);
      }
    }
  };
}
