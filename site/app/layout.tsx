import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_JP, Klee_One } from "next/font/google";
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
const kleeOne = Klee_One({
  variable: "--font-klee-one",
  weight: "600",
  display: "swap",
  preload: false,
});

const title = "temoto — 手元に、置いておく。";
const description =
  "Macではファイルとリンクの棚。Chromeでは、ページを試す6つの道具。アカウントなしで、手元に置いておく。";

export const metadata: Metadata = {
  metadataBase: new URL("https://temoto.haygsiiii.chatgpt.site"),
  title,
  description,
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
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
  return <html lang="ja"><body className={`${ibmPlexSansJP.variable} ${ibmPlexMono.variable} ${kleeOne.variable}`}>{children}</body></html>;
}
