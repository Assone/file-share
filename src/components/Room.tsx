"use client";

import useRoom, { type User } from "@/hooks/useRoom";
import { TransitionStatus } from "@/hooks/useTransition";
import { Laptop, Smartphone } from "lucide-react";
import TransitionProgress from "./TransitionProgress";
import { Button } from "./ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";

interface RoomProps {
  name: string;
}

const Room: React.FC<RoomProps> = ({ name }) => {
  const {
    users,
    transitionRequests,
    transitionStatus,
    transitionProgress,
    onTransitionRequest,
    onTransitionAccept,
    onTransitionReject,
  } = useRoom(name);

  const onFileChange =
    (target: User) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      evt.preventDefault();

      const files = Array.from(evt.target.files || []);

      evt.target.value = "";

      onTransitionRequest(target, files);
    };

  return (
    <div>
      <ul className="flex gap-4">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col items-center">
            <Popover open={transitionRequests[user.id] !== undefined}>
              <PopoverAnchor>
                <TransitionProgress progress={transitionProgress[user.id]}>
                  <label htmlFor="file">
                    <div className="border rounded-full p-4 cursor-pointer bg-white">
                      {user.mobile ? <Smartphone /> : <Laptop />}
                    </div>
                  </label>
                </TransitionProgress>
              </PopoverAnchor>
              <PopoverContent className="flex flex-col gap-2">
                <p className="break-words">
                  {transitionRequests[user.id]?.length === 1
                    ? `${user.name} wants send ${
                        transitionRequests[user.id]?.[0].name
                      } to you.`
                    : `${user.name} wants send ${
                        transitionRequests[user.id]?.length
                      } files to you.`}
                </p>
                <div className="flex justify-end gap-4">
                  <Button onClick={() => onTransitionReject(user)}>
                    Reject
                  </Button>
                  <Button onClick={() => onTransitionAccept(user)}>
                    Accept
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <span className="font-bold">{user.name}</span>
            <div className="flex gap-1 text-xs text-neutral-400">
              <span>{transitionProgress[user.id]}</span>
              {transitionStatus[user.id] === TransitionStatus.pending && (
                <span>Pending</span>
              )}
              {transitionStatus[user.id] === TransitionStatus.rejected && (
                <span>Rejected</span>
              )}
              {transitionStatus[user.id] === TransitionStatus.accepted && (
                <span>Accepted</span>
              )}
              {transitionStatus[user.id] === undefined && (
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
