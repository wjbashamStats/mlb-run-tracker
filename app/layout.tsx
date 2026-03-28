import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MLB Run Tracker",
  description: "First team to score runs 0–13 across the season wins the pot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
