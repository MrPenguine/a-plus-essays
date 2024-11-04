import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseAndValidateDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}
