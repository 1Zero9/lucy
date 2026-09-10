import "./globals.css";
import { OfflineBar } from "@/components/offline-bar";

export const metadata = {
  title: "LUCY",
  description: "Your learning workspace.",
  manifest: "/manifest.webmanifest"
};

export const viewport = {
  themeColor: "#7C3AED"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <OfflineBar />
      </body>
    </html>
  );
}
