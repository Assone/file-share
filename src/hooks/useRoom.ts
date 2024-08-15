"use client";

import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/react";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
} from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import useTransition from "./useTransition";

export interface User {
  id: string;
  name: string;
  platform: string;
  browser: string;
  mobile: boolean;
}

export default function useRoom(roomName: string) {
  const supabase = useRef(createClient());
  const [user] = api.user.info.useSuspenseQuery();
  const [participants, setParticipants] = useState<User[]>([]);
  const users = useMemo(
    () => participants.filter((u) => u.id !== user.id),
    [participants, user.id]
  );

  const channel = useRef<RealtimeChannel>();

  const {
    requests: transitionRequests,
    status: transitionStatus,
    progress: transitionProgress,

    accept: onTransitionAccept,
    reject: onTransitionReject,
    request: onTransitionRequest,
  } = useTransition(roomName);

  useEffect(() => {
    const roomChannel = supabase.current
      .channel(`room:${roomName}`)
      .on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          const state = roomChannel.presenceState<User>();

          setParticipants(Object.values(state).map(([value]) => value));
        }
      )

      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await roomChannel.track(user);
        }
      });

    channel.current = roomChannel;

    return () => {
      supabase.current.removeChannel(roomChannel);
      channel.current = undefined;
    };
  }, [roomName, user, user.id]);

  return {
    users,

    transitionRequests,
    transitionStatus,
    transitionProgress,

    onTransitionRequest,
    onTransitionAccept,
    onTransitionReject,
  };
}
