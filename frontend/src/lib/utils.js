import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CLEARBIT_LOGO_RE = /^https?:\/\/logo\.clearbit\.com\/([^/?#]+)/;

export function sanitizeCompanyLogoUrl(src) {
  if (!src || typeof src !== "string") return "";
  const match = src.match(CLEARBIT_LOGO_RE);
  if (match) {
    const domain = match[1].replace(/^\*\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }
  return src;
}
