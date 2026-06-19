export function todayISO(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function addDaysISO(days: number, date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}