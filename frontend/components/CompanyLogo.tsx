"use client";

import Image from "next/image";
import { useState } from "react";
import { getLogoUrl } from "@/lib/companies";

type CompanyLogoProps = {
  slug: string;
  name: string;
  size?: number;
  className?: string;
};

export function CompanyLogo({ slug, name, size = 20, className = "" }: CompanyLogoProps) {
  const [error, setError] = useState(false);
  const url = getLogoUrl(slug);

  if (!url || error) {
    // Fallback: coloured initial circle
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-stone-100 font-medium text-ink ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      alt={`${name} logo`}
      className={`shrink-0 rounded-full object-contain ${className}`}
      height={size}
      src={url}
      width={size}
      onError={() => setError(true)}
    />
  );
}
