export function computeDaysUntilIfApplicable(userText: string): { label: string; days: number; targetISO: string } | null {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const lower = userText.toLowerCase();
  const isAskingDays = /\bhow many days\b|\bdays\s+until\b/.test(lower);
  if (!isAskingDays) return null;

  const year = today.getUTCFullYear();
  const holidays: Record<string, () => Date> = {
    christmas: () => new Date(Date.UTC(year, 11, 25)),
    'new year': () => new Date(Date.UTC(year + 1, 0, 1)),
    "new year's": () => new Date(Date.UTC(year + 1, 0, 1)),
  };

  for (const key of Object.keys(holidays)) {
    if (lower.includes(key)) {
      let target = holidays[key]();
      if (target <= today) {
        if (key === 'christmas') target = new Date(Date.UTC(year + 1, 11, 25));
      }
      const diffMs = target.getTime() - today.getTime();
      const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      return { label: key, days, targetISO: target.toISOString().slice(0, 10) };
    }
  }

  const dateMatch = lower.match(
    /\b(?:on\s+)?([a-z]{3,9}\s+\d{1,2}(?:,\s*\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/,
  );
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      let target = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
      if (target <= today) {
        target = new Date(Date.UTC(today.getUTCFullYear() + 1, parsed.getUTCMonth(), parsed.getUTCDate()));
      }
      const diffMs = target.getTime() - today.getTime();
      const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      return { label: dateMatch[1], days, targetISO: target.toISOString().slice(0, 10) };
    }
  }

  return null;
}
