export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getProgressPercentage = (remaining, total) => {
  if (!total || total <= 0) return 0;
  const elapsed = (total * 60) - remaining;
  return Math.min(100, Math.max(0, (elapsed / (total * 60)) * 100));
};

export const formatShiftTime = (val) => {
  if (!val) return '09:00';
  if (typeof val === 'string') return val;
  // Handle Firestore Timestamp
  if (val && typeof val === 'object' && 'seconds' in val) {
    const date = new Date(val.seconds * 1000);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return '09:00';
};

export const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const years = [2023, 2024, 2025, 2026];
