import RoomLatency from "@/components/RoomLatency";
import { api } from "@/utils/trpc/server";
import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";

const Layout: React.FC<PropsWithChildren> = async ({ children }) => {
  const user = await api.user.info();
  const cookieStore = cookies();

  return (
    <div className="flex flex-col justify-center items-center h-full p-4">
      <div className="flex-1 w-full">{children}</div>
      <div className="flex items-center gap-10">
        <RoomLatency className="flex-shrink-0" />
        <p className="text-sm text-neutral-400">
          User: {user.name}, Id: {user.id}
        </p>
      </div>
    </div>
  );
};

export default Layout;
