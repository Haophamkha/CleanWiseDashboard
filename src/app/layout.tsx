"use client";

import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "@/store/store";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning>
        <Provider store={store}>{children}</Provider>
        <Toaster position="top-right" richColors toastOptions={{ classNames: { title: "whitespace-pre-line break-words" } }} />
      </body>
    </html>
  );
}
