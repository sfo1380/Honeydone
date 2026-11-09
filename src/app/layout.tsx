import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Honeydone",
  description: "Chores, shopping, kids' activities and budget for the two of you.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5b301",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Almost every page depends on who is signed in, so pages stream in behind this boundary. */}
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </body>
    </html>
  );
}

function Loading() {
  return (
    <div role="status" className="flex flex-1 items-center justify-center p-10 text-muted">
      Loading…
    </div>
  );
}
