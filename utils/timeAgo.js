// utils/timeAgo.js
export function timeAgo(date) {
  if (!date) return "";

  const now = new Date();
  const past = new Date(date);

  // Use absolute difference in seconds
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 5) return "just now";

  // Define units dynamically for more accurate date math
  const units = [
    ["year", 365 * 24 * 60 * 60],
    ["month", 30 * 24 * 60 * 60],
    ["week", 7 * 24 * 60 * 60],
    ["day", 24 * 60 * 60],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [label, secondsPerUnit] of units) {
    const count = Math.floor(diffInSeconds / secondsPerUnit);
    if (count >= 1) {
      // For more precise year/month handling, use actual calendar math
      if (label === "year" || label === "month") {
        const years = now.getFullYear() - past.getFullYear();
        const months =
          years * 12 + (now.getMonth() - past.getMonth());

        if (years >= 1 && label === "year") {
          return `${years} year${years > 1 ? "s" : ""} ago`;
        }
        if (months >= 1 && label === "month") {
          return `${months} month${months > 1 ? "s" : ""} ago`;
        }
      }

      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
