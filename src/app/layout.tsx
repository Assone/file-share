import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/utils/trpc/react";
import { HydrateClient } from "@/utils/trpc/server";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FileShare",
  description: "Online file transfer website based on WebRTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(inter.className, "h-full")}>
        <TRPCReactProvider>
          <HydrateClient>{children}</HydrateClient>
        </TRPCReactProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
