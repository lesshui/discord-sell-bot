import type { Metadata } from "next";
import "./styles.css";
import { Geist, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: "Pokemon Card Instant Offers",
  description: "Discord-integrated Pokemon trading card instant-offer MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, jetbrainsMono.variable)}>
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
