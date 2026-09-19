"use client";

import { useToggleServiceActiveMutation } from "@/services/servicesApi";

export default function ServiceStatusToggle({
  id,
  isActive,
}: {
  id: number;
  isActive: boolean;
}) {
  const [toggleActive, { isLoading }] = useToggleServiceActiveMutation();

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => toggleActive({ id, is_active: !isActive })}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
        isActive ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          isActive ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
