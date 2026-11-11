import type { Metadata } from "next";
// Self-hosted (bundled) — no network needed at build or runtime.
import "@fontsource-variable/manrope/wght.css";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "График смен — CRM",
  description: "Планирование графика смен сотрудников",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
