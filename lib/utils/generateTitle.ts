export function generateTitle(content: string): string {
  const cleaned = content.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}
