import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_JP } from "next/font/google";
import "./globals.css";

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const title = "temoto — Chromeの作業を、手元で整える。";
const description =
  "Chromeでページを試す6つの道具と、開発用プロキシを安全に切り替えるためのtemoto。";

export const metadata: Metadata = {
  metadataBase: new URL("https://temoto.haygsiiii.chatgpt.site"),
  title,
  description,
  icons: {
    icon: [{ url: "/product-chrome-icon.png", type: "image/png" }],
    shortcut: ["/product-chrome-icon.png"],
  },
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og-temoto.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-temoto.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className={`${ibmPlexSansJP.variable} ${ibmPlexMono.variable}`}>{children}</body></html>;
}
