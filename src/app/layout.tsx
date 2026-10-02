"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning>
        <Provider store={store}>{children}<Toaster richColors position="top-right" /></Provider>
      </body>
    </html>
  );
}
