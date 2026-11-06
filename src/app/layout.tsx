import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/comfortaa";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: {
    default: "Nimbrial — Engineering evolution.",
    template: "%s — Nimbrial",
  },
  description:
    "A Cape Town studio building business systems, AI automation, premium websites and secure cloud operations — scoped honestly and improved after launch.",
};

export const viewport: Viewport = {
  themeColor: "#061224",
};

// Runs before paint: only hide [data-reveal] elements when JS will animate them in.
const motionFlag = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-motion')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        <SmoothScroll />
        <Nav />
        {children}
      </body>
    </html>
  );
}
