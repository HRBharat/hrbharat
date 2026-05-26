import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without style conflicts or duplication bugs.
 * Used heavily by UI atoms and layout layers to handle context-driven design tokens.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats standard numeric integers or float point strings cleanly into 
 * the institutional Indian National Rupee (INR) currency format standard.
 * * Example: 24500 -> ₹24,500.00
 */
export function formatINR(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  
  // Safe validation fallback parameter boundary check
  if (isNaN(value) || value === null || value === undefined) {
    return "₹0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}