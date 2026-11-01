import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  title: "RE — Recovery, in motion.",
  description:
    "Concept prototype of RE, a proposed smart knee support and recovery-tracking platform. All data is simulated and illustrative; RE is not an existing or clinically validated medical device.",
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>{children}</body>
    </html>
  );
}
