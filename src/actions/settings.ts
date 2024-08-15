"use server";

import { cookies } from "next/headers";

export type State = {
  status: "success";
} | null;

export const update = async (
  _prevState: State,
  data: FormData
): Promise<State> => {
  const cookie = cookies();
  const username = data.get("username") as string;

  cookie.set("name", username);

  return {
    status: "success",
  };
};
