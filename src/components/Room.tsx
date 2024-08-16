"use client";

import useRoom, { type User } from "@/hooks/useRoom";
import useTransition, {
  ConnectionStatus,
  TransitionStatus,
} from "@/hooks/useTransition";
import { Laptop, Smartphone } from "lucide-react";
import TransitionProgress from "./TransitionProgress";
import { Button } from "./ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface RoomProps {
  name: string;
}

const Room: React.FC<RoomProps> = ({ name }) => {
  const { users } = useRoom(name);
  const {
    meta,
    status,
    progress,
    connections,

    accept,
    reject,
    request,
  } = useTransition(name);

  const onFileChange =
    (target: User) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      evt.preventDefault();

      const files = Array.from(evt.target.files || []);

      evt.target.value = "";

      request(target, files);
    };

  const renderConnectionStatus = (status?: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.connecting:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
                </span>
              </TooltipTrigger>

              <TooltipContent>WebRTC Connecting</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case ConnectionStatus.connected:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
              </TooltipTrigger>

              <TooltipContent>WebRTC Connected</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case ConnectionStatus.error:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </TooltipTrigger>

              <TooltipContent>WebRTC Error</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <ul className="flex gap-4">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col items-center">
            <Popover open={meta[user.id] !== undefined}>
              <PopoverAnchor>
                <TransitionProgress progress={progress[user.id]}>
                  <label htmlFor="file">
                    <div className="border rounded-full p-4 cursor-pointer bg-white">
                      {user.mobile ? <Smartphone /> : <Laptop />}
                    </div>
                  </label>
                </TransitionProgress>
              </PopoverAnchor>
              <PopoverContent className="flex flex-col gap-2">
                <p className="break-words">
                  {meta[user.id]?.length === 1
                    ? `${user.name} wants send ${
                        meta[user.id]?.[0].name
                      } to you.`
                    : `${user.name} wants send ${
                        meta[user.id]?.length
                      } files to you.`}
                </p>

                <div className="flex justify-end gap-4">
                  <Button onClick={() => reject(user)}>Reject</Button>
                  <Button onClick={() => accept(user)}>Accept</Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 items-center">
              <span className="font-bold">{user.name}</span>
              {renderConnectionStatus(connections[user.id])}
            </div>

            <div className="flex gap-1 text-xs text-neutral-400">
              <span>{progress[user.id]}</span>
              {status[user.id] === TransitionStatus.pending && (
                <span>Pending</span>
              )}
              {status[user.id] === TransitionStatus.rejected && (
                <span>Rejected</span>
              )}
              {status[user.id] === TransitionStatus.accepted && (
                <span>Accepted</span>
              )}
              {status[user.id] === undefined && (
                <>
                  <span>{user.platform}</span>
                  <span>{user.browser}</span>
                </>
              )}
            </div>
            <input
              hidden
              id="file"
              type="file"
              multiple
              onChange={onFileChange(user)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Room;
