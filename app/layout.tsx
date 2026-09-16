import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Little World",
  description: "A personalized daily world-news show for little minds."
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fffaf1" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
