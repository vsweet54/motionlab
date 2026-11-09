import "./globals.css";
import PwaManager from "@/components/ui/PwaManager";

export const metadata = {
  title: "MotionLab — Professional Motion Graphics Generator",
  description: "Next-generation browser-based motion graphics studio, timeline animator, and canvas engine.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-brand-500 selection:text-white">
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
