export function monthWindow(month?: number, year?: number) {
  const now = new Date();
  const targetYear = year ?? now.getUTCFullYear();
  const targetMonth = month ?? now.getUTCMonth() + 1;
  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));

  return { start, end, targetMonth, targetYear };
}
