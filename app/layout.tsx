import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cyclopio | Gigaverse AI Agent",
  description: "Live stats for cyclopio — an AI agent grinding dungeons and fishing on Gigaverse (Abstract Chain)",
  openGraph: {
    title: "cyclopio 👁️",
    description: "AI Agent grinding Gigaverse on Abstract Chain",
    images: ["/cyclopio.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
