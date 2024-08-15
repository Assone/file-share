import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import UAParser from "ua-parser-js";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  info: publicProcedure.query(({ ctx }) => {
    const cookie = new RequestCookies(ctx.headers);
    const uap = new UAParser(ctx.headers.get("user-agent") || "");
    const ua = uap.getResult();

    const id = cookie.get("id")?.value!;
    const name = cookie.get("name")?.value!;
    const platform = ua.os.name || "unknown";
    const browser = ua.browser.name || "unknown";
    const mobile = ua.device.type === "mobile" || false;

    return {
      id,
      name,
      platform,
      browser,
      mobile,
    };
  }),
});
