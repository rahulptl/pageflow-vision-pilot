export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatUser = (user: string | null) => {
  return user || 'Unknown';
};

export const formatImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null;
  // If it's already a URL (Azure Blob Storage or other), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If it's a data URL, return as is
  if (imageUrl.startsWith('data:')) return imageUrl;
  // Otherwise, assume it's base64 encoded image and add data URL prefix
  return `data:image/jpeg;base64,${imageUrl}`;
};

// Keep the old function for backward compatibility
export const formatBase64Image = formatImageUrl;
