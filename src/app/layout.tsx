import "./globals.css";
import { OfflineBar } from "@/components/offline-bar";
import { isProductionEnv } from "@/lib/env";

export const metadata = {
  title: "LUCY",
  description: "Your learning workspace.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/lucy-app-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/lucy-app-icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: "/icons/lucy-app-icon-180.png"
  }
};

export const viewport = {
  themeColor: "#7C3AED"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dev = !isProductionEnv();

  return (
    <html lang="en" data-env={dev ? "dev" : "production"}>
      <head>
        {/* Inter keeps long-form note content exceptionally readable; Plus
            Jakarta Sans gives navigation and headings a crisp, contemporary
            product voice without making the workspace feel like a magazine. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
        />
      </head>
      <body>
        {dev ? (
          <div className="dev-banner" role="status">
            DEV — test data, not production
          </div>
        ) : null}
        {children}
        <OfflineBar />
      </body>
    </html>
  );
}
