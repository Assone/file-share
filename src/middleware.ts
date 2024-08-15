import {
  NextResponse,
  type MiddlewareConfig,
  type NextRequest,
} from "next/server";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";

const getSeedByString = (value: string) => {
  return value.split("").reduce((hash, _char, index) => {
    const code = value.charCodeAt(index);
    hash = (hash << 5) - hash + code;
    hash |= 0; // Convert

    return hash;
  }, 0);
};

export const middleware = async (request: NextRequest) => {
  const response = NextResponse.next({
    request,
  });

  if (!request.cookies.has("id")) {
    const id = crypto.randomUUID();

    const displayName = uniqueNamesGenerator({
      length: 2,
      separator: " ",
      dictionaries: [colors, animals],
      style: "capital",
      seed: getSeedByString(id),
    });
    response.cookies.set("id", id);
    response.cookies.set("name", displayName);
  }

  const ip = request.ip || request.headers.get("X-Forwarded-For");

  if (ip) {
    response.cookies.set("ip", ip);
  }

  return response;
};

export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
