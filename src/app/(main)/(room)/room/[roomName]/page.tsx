import Room from "@/components/Room";

const Page: React.FC<{ params: { roomName: string } }> = ({ params }) => {
  return (
    <div className="flex justify-center items-center h-full">
      <Room name={decodeURIComponent(params.roomName)} />
    </div>
  );
};

export default Page;
