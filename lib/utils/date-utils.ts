import { parseISO, format, differenceInMilliseconds, formatDistanceToNow } from 'date-fns';

export function parseAndFormatDate(dateString: string): string {
  try {
    // Try different date formats
    let date: Date | null = null;

    // Try as ISO string
    try {
      date = parseISO(dateString);
      if (isValidDate(date)) return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {}

    // Try as regular date string
    try {
      date = new Date(dateString);
      if (isValidDate(date)) return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {}

    // Try parsing custom format (add more as needed)
    const patterns = [
      /(\d{2})[-/](\d{2})[-/](\d{4})\s?(\d{2})?:?(\d{2})?/,  // DD-MM-YYYY HH:mm
      /(\d{4})[-/](\d{2})[-/](\d{2})\s?(\d{2})?:?(\d{2})?/   // YYYY-MM-DD HH:mm
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        const [_, ...parts] = match;
        date = new Date(parts.join('-'));
        if (isValidDate(date)) return format(date, "MMM d, yyyy h:mm a");
      }
    }

    return 'Invalid date';
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'Invalid date';
  }
}

export function getTimeRemaining(dateString: string): string {
  try {
    let date: Date | null = null;

    // Try different date parsing methods
    try {
      date = parseISO(dateString);
    } catch (e) {
      date = new Date(dateString);
    }

    if (!isValidDate(date)) return 'Invalid deadline';

    const now = new Date();
    const diff = differenceInMilliseconds(date, now);

    if (diff < 0) return 'Deadline passed';

    // Calculate remaining time
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let remaining = '';
    if (days > 0) remaining += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) remaining += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) remaining += `${minutes} minute${minutes > 1 ? 's' : ''} `;

    return remaining ? `${remaining.trim()} remaining` : 'Less than a minute remaining';
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return 'Invalid deadline';
  }
}

function isValidDate(date: Date | null): boolean {
  return date instanceof Date && !isNaN(date.getTime());
} 