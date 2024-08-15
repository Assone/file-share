import Room from "@/components/Room";
import { cookies } from "next/headers";

const Page: React.FC = async () => {
  const cookieStore = cookies();
  const ip = cookieStore.get("ip")?.value || "local";

  return (
    <div className="h-full flex justify-center items-center">
      <Room name={ip} />
    </div>
  );
};

export default Page;
