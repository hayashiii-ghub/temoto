import type { Metadata } from "next";
import "./globals.css";

const title = "temoto";
const description =
  "Color Picker, Screenshot, CSS, Video Speed, and simple Proxy switching in one Chrome extension.";

export const metadata: Metadata = {
  metadataBase: new URL("https://temoto.hayashiii-gpt.chatgpt.site"),
  title,
  description,
  icons: {
    icon: [{ url: "/temoto-mark.svg", type: "image/svg+xml" }],
    shortcut: ["/temoto-mark.svg"],
  },
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-temoto.png?v=ad48b7f1619d", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-temoto.png?v=ad48b7f1619d"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
