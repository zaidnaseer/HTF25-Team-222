import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function getInitials(name = 'User') {
  if (!name || typeof name !== 'string') return 'U';

  const parts = name.trim().split(' ');
  
  // Use first and last initial if available
  if (parts.length > 1) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  } 
  
  // Use first two letters if only one word
  else if (parts[0] && parts[0].length > 1) {
    return (parts[0][0] + parts[0][1]).toUpperCase();
  } 
  
  // Use first letter if only one letter
  else if (parts[0] && parts[0].length === 1) {
    return parts[0][0].toUpperCase();
  }
  
  // Fallback for empty or invalid names
  return 'U';
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
