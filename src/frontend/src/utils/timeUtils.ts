export function formatRelativeTime(timestampNs: bigint): string {
  const ms = Number(timestampNs / 1_000_000n);
  const now = Date.now();
  const diff = now - ms;

  if (diff < 0) return "just now";
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) {
    const mins = Math.floor(diff / 60_000);
    return `${mins}m ago`;
  }
  if (diff < 86_400_000) {
    const hrs = Math.floor(diff / 3_600_000);
    return `${hrs}h ago`;
  }
  if (diff < 86_400_000 * 2) return "Yesterday";
  if (diff < 86_400_000 * 7) {
    const days = Math.floor(diff / 86_400_000);
    return `${days}d ago`;
  }
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTime(timestampNs: bigint): string {
  const ms = Number(timestampNs / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
