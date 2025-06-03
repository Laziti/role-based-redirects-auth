/**
 * Format a number as currency (ETB - Ethiopian Birr)
 */
export const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null) {
    console.log('[Formatter] Received null/undefined amount');
    return 'ETB 0';
  }
  
  // Log the incoming amount
  console.log('[Formatter] Raw amount:', amount);
  console.log('[Formatter] Amount type:', typeof amount);
  console.log('[Formatter] Amount toString():', amount.toString());
  
  // Create the formatter
  const formatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // Format the amount
  const formatted = formatter.format(amount);
  console.log('[Formatter] Formatted result:', formatted);
  
  return formatted;
};

/**
 * Create a URL-friendly slug from text
 */
export const createSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/**
 * Format a date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Simple hash function to create short IDs
export const createShortHash = (id: string): string => {
  // Convert the UUID to a number
  const num = id.split('-').reduce((acc, part) => {
    return acc + parseInt(part, 16);
  }, 0);
  
  // Convert to base36 (0-9 and a-z) and take first 6 characters
  return num.toString(36).slice(0, 6);
};

// Store mapping of short hashes to full IDs
const hashToIdMap = new Map<string, string>();

export const encodeListingId = (id: string): string => {
  const shortHash = createShortHash(id);
  hashToIdMap.set(shortHash, id);
  return shortHash;
};

export const decodeListingId = (encodedId: string): string => {
  // If it's a short hash, get the full ID from the map
  const fullId = hashToIdMap.get(encodedId);
  if (fullId) {
    return fullId;
  }
  
  // Fallback to base64 decoding for backward compatibility
  try {
    const padding = encodedId.length % 4;
    const paddedId = padding ? encodedId + '='.repeat(4 - padding) : encodedId;
    const base64 = paddedId.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64);
  } catch (error) {
    console.error('Error decoding listing ID:', error);
    return encodedId;
  }
};
