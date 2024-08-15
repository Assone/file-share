"use client";

import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

export default function useLatency() {
  const [latency, setLatency] = useState(0);
  const [user] = api.user.info.useSuspenseQuery();
  const supabase = useRef(createClient());

  useEffect(() => {
    let timeId: NodeJS.Timeout;
    const channel = supabase.current.channel(`ping:${user.id}`, {
      config: { broadcast: { ack: true } },
    });

    channel.subscribe((status) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        timeId = setInterval(async () => {
          const start = performance.now();
          const response = await channel.send({
            type: "broadcast",
            event: "PING",
          });

          if (response !== "ok") {
            setLatency(-1);
          } else {
            const end = performance.now();
            const newLatency = end - start;

            setLatency(newLatency);
          }
        }, 1000);
      }
    });

    return () => {
      clearInterval(timeId);
      channel.unsubscribe();
    };
  }, [user.id]);

  return {
    latency,
  };
}
