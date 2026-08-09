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

export const metadata: Metadata = {
  metadataBase: new URL("https://shelfdrop.haygsiiii.chatgpt.site"),
  title: "ShelfDrop — 移動する前に、置いておく。",
  description: "ファイル、フォルダ、リンク、テキストを一時的に置ける、macOS用の小さなフローティングシェルフ。",
  openGraph: {
    title: "ShelfDrop — 移動する前に、置いておく。",
    description: "Finderの選択項目も、リンクも、テキストも。作業の流れを止めずに手元へ置けるmacOS用フローティングシェルフ。",
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ShelfDrop — 移動する前に、置いておく。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShelfDrop — 移動する前に、置いておく。",
    description: "作業の流れを止めずに手元へ置ける、macOS用フローティングシェルフ。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className={`${ibmPlexSansJP.variable} ${ibmPlexMono.variable}`}>{children}</body></html>;
}
