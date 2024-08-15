"use client";

import useLatency from "@/hooks/useLatency";
import { cn } from "@/lib/utils";

interface RoomLatencyProps {
  className?: string;
}

const RoomLatency: React.FC<RoomLatencyProps> = ({ className }) => {
  const { latency } = useLatency();

  return (
    <div
      className={cn(
        "text-xs py-1 px-4 border rounded-full text-green-500 border-green-500 bg-green-50",
        {
          "text-orange-500": latency > 500,
          "text-red-500": latency === -1,
          "border-orange-500": latency > 500,
          "border-red-500": latency === -1,
          "bg-orange-50": latency > 500,
          "bg-red-50": latency === -1,
        },
        className
      )}
    >
      Latency: {latency === -1 ? "N/A" : latency.toFixed(2)}ms
    </div>
  );
};

export default RoomLatency;
