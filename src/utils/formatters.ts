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

export const formatBase64Image = (base64: string | null) => {
  if (!base64) return null;
  // If it's already a data URL, return as is
  if (base64.startsWith('data:')) return base64;
  // Otherwise, assume it's base64 encoded image and add data URL prefix
  return `data:image/jpeg;base64,${base64}`;
};
