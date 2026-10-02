"use client";

import { createContext } from "react";

// Keep the parent editor open and prevent saving an incomplete schema during uploads.
export const OptionImageUploadContext = createContext<(delta: number) => void>(
  () => {},
);
