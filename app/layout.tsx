import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noor AI",
  description: "Built by Saadat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
