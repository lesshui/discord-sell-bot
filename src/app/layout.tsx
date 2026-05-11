import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Pokemon Card Instant Offers",
  description: "Discord-integrated Pokemon trading card instant-offer MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
