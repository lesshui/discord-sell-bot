import type { Metadata } from "next";
import "./styles.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Pokemon Card Instant Offers",
  description: "Discord-integrated Pokemon trading card instant-offer MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
