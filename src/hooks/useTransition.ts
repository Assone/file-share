"use client";

import { isArrayBuffer } from "@/utils/is";
import FileMerger, { type FileMeta } from "@/utils/models/FileMerger";
import FileSplitter from "@/utils/models/FileSplitter";
import PeerConnection from "@/utils/models/PeerConnection";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/react";
import {
  REALTIME_LISTEN_TYPES,
  type RealtimeChannel,
} from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type Reducer,
} from "react";

interface User {
  id: string;
  name: string;
  platform: string;
  browser: string;
  mobile: boolean;
}

export enum TransitionStatus {
  pending,
  accepted,
  rejected,
}

type Target = "host" | "client";

type P2PMessage<T extends string, D extends Record<string, any> = {}> = {
  sid: string;
  type: T;
} & D;

type TransitionDataChannelMessages =
  | ArrayBuffer
  | P2PMessage<"transition-info", { size: number; count: number }>
  | P2PMessage<"transition-start">
  | P2PMessage<"transition-end">
  | P2PMessage<"transition-file-start", FileMeta>
  | P2PMessage<"transition-file-end", FileMeta>
  | P2PMessage<"transition-file-progress", { progress: number } & FileMeta>;

export enum ConnectionStatus {
  connecting,
  connected,
  error,
}

interface States {
  meta: Record<string, FileMeta[] | undefined>;
  status: Record<string, TransitionStatus | undefined>;
  progress: Record<string, number | undefined>;
  connections: Record<string, ConnectionStatus | undefined>;
}

type EventType<T extends string, D extends Record<string, any> = {}> = {
  type: T;
  payload: D;
};

type Actions =
  | EventType<"set-meta", { sid: string; meta: FileMeta[] | undefined }>
  | EventType<
      "set-status",
      {
        sid: string;
        status: TransitionStatus | undefined;
      }
    >
  | EventType<"set-progress", { sid: string; progress: number | undefined }>
  | EventType<
      "set-connection",
      { sid: string; status: ConnectionStatus | undefined }
    >;

const reducer: Reducer<States, Actions> = (prevState, action) => {
  switch (action.type) {
    case "set-meta": {
      const { sid, meta } = action.payload;

      return {
        ...prevState,
        meta: {
          ...prevState.meta,
          [sid]: meta,
        },
      };
    }

    case "set-status": {
      const { sid, status } = action.payload;

      return {
        ...prevState,
        status: {
          ...prevState.status,
          [sid]: status,
        },
      };
    }

    case "set-progress": {
      const { sid, progress } = action.payload;

      return {
        ...prevState,
        progress: {
          ...prevState.progress,
          [sid]: progress,
        },
      };
    }

    case "set-connection": {
      const { sid, status } = action.payload;

      return {
        ...prevState,
        connections: {
          ...prevState.connections,
          [sid]: status,
        },
      };
    }
  }
};

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);

  a.remove();
};

export default function useTransition(roomName: string) {
  const supabase = useRef(createClient());
  const channel = useRef<RealtimeChannel>();
  const [user] = api.user.info.useSuspenseQuery();
  const [state, dispatch] = useReducer(reducer, {
    meta: {},
    status: {},
    progress: {},
    connections: {},
  });
  const files = useRef(new Map<string, File[]>());
  const host = useRef(
    new Map<string, PeerConnection<TransitionDataChannelMessages>>()
  );
  const client = useRef(
    new Map<string, PeerConnection<TransitionDataChannelMessages>>()
  );

  const onIceCandidateListener = useCallback(
    (connection: RTCPeerConnection, sid: string, target: Target) => {
      connection.addEventListener("icecandidate", (evt) => {
        channel.current?.send({
          type: REALTIME_LISTEN_TYPES.BROADCAST,
          event: `ice:${sid}`,
          payload: {
            sid: user.id,
            target: target === "client" ? "host" : "client",
            candidate: evt.candidate,
          },
        });
      });
    },
    [user.id]
  );

  const onCreateHost = useCallback(
    async (sid: string) => {
      const peer = new PeerConnection<TransitionDataChannelMessages>();

      peer.addEventListener("status", ({ data }) => {
        const status =
          data === "connected"
            ? ConnectionStatus.connected
            : data === "connecting"
            ? ConnectionStatus.connecting
            : data === "failed"
            ? ConnectionStatus.error
            : undefined;

        dispatch({
          type: "set-connection",
          payload: {
            sid,
            status,
          },
        });
      });

      onIceCandidateListener(peer.connection!, sid, "host");
      const offer = await peer.connection?.createOffer();
      await peer.connection?.setLocalDescription(offer);

      channel.current?.send({
        type: REALTIME_LISTEN_TYPES.BROADCAST,
        event: `offer:${sid}`,
        payload: { sid: user.id, offer },
      });

      host.current.set(sid, peer);
    },
    [onIceCandidateListener, user.id]
  );

  const onCreateClient = async (sid: string) => {
    const peer = new PeerConnection<TransitionDataChannelMessages>({
      receiver: true,
    });

    onIceCandidateListener(peer.connection!, sid, "client");

    let info: { size: number; count: number } | null = null;
    let currentReceiverCount = 0;
    let chunkMerger: FileMerger | null = null;
    peer.addEventListener("message", ({ data: message }) => {
      if (isArrayBuffer(message)) {
        chunkMerger?.receive(message);

        return;
      }

      switch (message.type) {
        case "transition-file-start": {
          chunkMerger = new FileMerger(message);
          break;
        }

        case "transition-file-end": {
          const blob = chunkMerger!.merge()!;
          chunkMerger = null;
          currentReceiverCount += 1;

          downloadBlob(blob, message.name);

          break;
        }

        case "transition-file-progress": {
          const progress =
            (message.progress + currentReceiverCount) / (info?.count || 0);
          console.log("[PeerConnection] Received File Progress:", progress);

          dispatch({
            type: "set-progress",
            payload: {
              sid,
              progress,
            },
          });

          break;
        }

        case "transition-info": {
          info = message;
          break;
        }

        case "transition-start": {
          break;
        }

        case "transition-end": {
          dispatch({
            type: "set-progress",
            payload: {
              sid,
              progress: undefined,
            },
          });

          info = null;
          currentReceiverCount = 0;

          break;
        }
      }
    });
    peer.addEventListener("status", ({ data }) => {
      console.log("???", data);
      const status =
        data === "connected"
          ? ConnectionStatus.connected
          : data === "connecting"
          ? ConnectionStatus.connecting
          : data === "failed"
          ? ConnectionStatus.error
          : undefined;

      dispatch({
        type: "set-connection",
        payload: {
          sid,
          status,
        },
      });
    });

    client.current.set(sid, peer);
  };

  const onStartTransition = useCallback(async (sid: string) => {
    const fileList = files.current.get(sid) || [];
    const count = fileList.length;
    const size = fileList.reduce((acc, file) => acc + file.size, 0);
    const peer = host.current.get(sid);

    if (!peer) return;
    let currentReceiverCount = 0;

    const transition = (file: File) =>
      new Promise<void>(async (resolve) => {
        const splitter = new FileSplitter(file);
        const meta: FileMeta = {
          name: file.name,
          size: file.size,
          mime: file.type,
        };

        splitter.addEventListener("chunk", ({ data }) => {
          peer.send(data);
        });
        splitter.addEventListener("end", () => {
          peer.send({ type: "transition-file-end", ...meta, sid });
          currentReceiverCount += 1;
          resolve();
        });
        splitter.addEventListener("progress", ({ data }) => {
          peer.send({
            type: "transition-file-progress",
            progress: data,
            sid,
            ...meta,
          });

          const progress = (data + currentReceiverCount) / count;
          dispatch({
            type: "set-progress",
            payload: {
              sid,
              progress: progress,
            },
          });
        });

        peer.send({ type: "transition-file-start", ...meta, sid });

        await splitter.split();
      });

    peer.send({ type: "transition-info", size, count, sid });
    peer.send({ type: "transition-start", sid });

    for (const file of fileList) {
      await transition(file);
    }

    peer.send({ type: "transition-end", sid });

    dispatch({
      type: "set-progress",
      payload: {
        sid,
        progress: undefined,
      },
    });
    dispatch({
      type: "set-status",
      payload: { sid, status: undefined },
    });

    files.current.delete(sid);
  }, []);

  const request = (target: User, transitionFiles: File[]) => {
    if (channel.current) {
      channel.current.send({
        type: "broadcast",
        event: `request:${target.id}`,
        payload: {
          user,
          files: transitionFiles.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        },
      });

      files.current.set(target.id, transitionFiles);
      dispatch({
        type: "set-status",
        payload: { sid: target.id, status: TransitionStatus.pending },
      });
    }
  };

  const accept = async (target: User) => {
    if (channel.current) {
      channel.current.send({
        type: "broadcast",
        event: `accept:${target.id}`,
        payload: {
          user,
        },
      });

      dispatch({
        type: "set-meta",
        payload: { sid: target.id, meta: undefined },
      });

      if (!host.current.has(target.id)) {
        await onCreateClient(target.id);
      }
    }
  };

  const reject = (target: User) => {
    if (channel.current) {
      channel.current.send({
        type: "broadcast",
        event: `reject:${target.id}`,
        payload: {
          user,
        },
      });

      dispatch({
        type: "set-meta",
        payload: { sid: target.id, meta: undefined },
      });
    }
  };

  useEffect(() => {
    const roomChannel = supabase.current
      .channel(`transition:${roomName}`)
      .on<{ user: User; files: FileMeta[] }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `request:${user.id}` },
        ({ payload }) => {
          dispatch({
            type: "set-meta",
            payload: { sid: payload.user.id, meta: payload.files },
          });
        }
      )
      .on<{ user: User }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `accept:${user.id}` },
        async ({ payload }) => {
          dispatch({
            type: "set-status",
            payload: { sid: user.id, status: TransitionStatus.accepted },
          });
          dispatch({
            type: "set-meta",
            payload: { sid: user.id, meta: undefined },
          });

          if (!host.current.has(payload.user.id)) {
            await onCreateHost(payload.user.id);
          }

          onStartTransition(payload.user.id);
        }
      )
      .on<{ user: User }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `reject:${user.id}` },
        ({ payload }) => {
          dispatch({
            type: "set-status",
            payload: {
              sid: payload.user.id,
              status: TransitionStatus.rejected,
            },
          });
          dispatch({
            type: "set-meta",
            payload: { sid: user.id, meta: undefined },
          });
          files.current.delete(payload.user.id);
        }
      )
      .on<{ sid: string; target: Target; candidate: RTCIceCandidate }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `ice:${user.id}` },
        async ({ payload }) => {
          const container = payload.target === "host" ? host : client;
          await container.current
            .get(payload.sid)
            ?.connection?.addIceCandidate(payload.candidate);
        }
      )
      .on<{ sid: string; offer: RTCSessionDescription }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `offer:${user.id}` },
        async ({ payload }) => {
          const connection = client.current.get(payload.sid);
          await connection?.connection?.setRemoteDescription(payload.offer);
          const answer = await connection?.connection?.createAnswer();

          await connection?.connection?.setLocalDescription(answer);

          channel.current?.send({
            type: REALTIME_LISTEN_TYPES.BROADCAST,
            event: `answer:${payload.sid}`,
            payload: { sid: user.id, answer },
          });
        }
      )
      .on<{ sid: string; answer: RTCSessionDescription }>(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: `answer:${user.id}` },
        async ({ payload }) => {
          await host.current
            .get(payload.sid)
            ?.connection?.setRemoteDescription(payload.answer);
        }
      )
      .subscribe();

    channel.current = roomChannel;

    return () => {
      supabase.current.removeChannel(roomChannel);
      channel.current = undefined;
    };
  }, [onCreateHost, onStartTransition, roomName, user.id]);

  return {
    ...state,

    accept,
    reject,
    request,
  };
}
