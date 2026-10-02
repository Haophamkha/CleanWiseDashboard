"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BrushCleaning,
  CalendarCheck,
  Fan,
  ImageIcon,
  Sofa,
  Truck,
} from "lucide-react";

type Props = {
  icon?: string | null;
  primaryImage?: string | null;
  code: string;
  sectionCode: string;
  name: string;
};

export default function ServiceThumbnail({
  icon,
  primaryImage,
  code,
  sectionCode,
  name,
}: Props) {
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const source = [icon, primaryImage].find(
    (url) => url && !failedImages.includes(url),
  );
  const Fallback =
    code === "HOME_CLEANING_MONTHLY"
      ? CalendarCheck
      : sectionCode === "HOME_CLEANING"
        ? BrushCleaning
        : sectionCode === "APPLIANCE_CLEANING"
          ? Fan
          : sectionCode === "MOVING"
            ? Truck
            : sectionCode === "UPHOLSTERY_CLEANING"
              ? Sofa
              : ImageIcon;

  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-blue-50 text-blue-500"
      title={source ? name : "Chưa có ảnh đại diện dịch vụ"}
    >
      {source ? (
        <Image
          src={source}
          alt={`Ảnh đại diện ${name}`}
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 object-cover"
          onError={() => setFailedImages((urls) => [...urls, source])}
        />
      ) : (
        <Fallback className="h-5 w-5" aria-hidden="true" />
      )}
    </div>
  );
}
