export type MarketingImage = { imageUrl: string; imagePublicId?: string | null };

export type MarketingActivity = {
  id: string;
  clientId: string;
  creativeName: string;
  platform: string;
  uploadedAt: string;
  spendRupees: string | number;
  location: string | null;
  showDailySpendToClient: boolean;
  totalImpressions: number | null;
  totalReach: number | null;
  totalResult: string | null;
  costPerResult: string | number | null;
  takenDownAt: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  images?: MarketingImage[];
  notes: string | null;
  client?: { id: string; name: string; color: string };
};

export const adSpendGstNotice = '*Please note that the ad spend mentioned is exclusive of GST. An additional 18% GST will be applicable on the advertising spend';

export function marketingImageUrls(item: MarketingActivity) {
  return [...new Set([
    ...(item.imageUrl ? [item.imageUrl] : []),
    ...(item.images ?? []).map(image => image.imageUrl),
  ])];
}

export const marketingCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const count = new Intl.NumberFormat('en-IN');

export function dailySpend(spend: string | number, uploadedAt: string, takenDownAt: string | null, now: Date) {
  if (spend === '' || !uploadedAt) return '—';
  const start = new Date(uploadedAt);
  const end = takenDownAt ? new Date(takenDownAt) : now;
  if (end < start || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return '—';
  const dayIndex = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return marketingCurrency.format(Number(spend) / (dayIndex(end) - dayIndex(start) + 1));
}

export function canSeeDailySpend(item: MarketingActivity, canManage: boolean) {
  return canManage || item.showDailySpendToClient !== false;
}

export function formatMarketingMetrics(item: MarketingActivity, now: Date, canManage = false) {
  const metrics = [
    ['Total impressions', item.totalImpressions == null ? '—' : count.format(item.totalImpressions)],
    ['Total reach', item.totalReach == null ? '—' : count.format(item.totalReach)],
    ['Total result', item.totalResult || '—'],
    ['Location', item.location || '\u2014'],
    ['Cost per result', item.costPerResult == null ? '—' : marketingCurrency.format(Number(item.costPerResult))],
  ];
  if (canSeeDailySpend(item, canManage)) {
    metrics.unshift(['Daily spend', dailySpend(item.spendRupees, item.uploadedAt, item.takenDownAt, now)]);
  }
  return metrics;
}

export function marketingReportCsv(items: MarketingActivity[], now: Date, canManage: boolean) {
  const rows = [
    ['Client', 'Creative', 'Platform', 'Location', 'Uploaded at', 'Taken down at', 'Total spend (INR)',
      'Daily spend', 'Total impressions', 'Total reach', 'Total result', 'Cost per result (INR)'],
    ...items.map(item => [
      item.client?.name, item.creativeName, item.platform, item.location, item.uploadedAt, item.takenDownAt,
      item.spendRupees, canSeeDailySpend(item, canManage)
        ? dailySpend(item.spendRupees, item.uploadedAt, item.takenDownAt, now) : '',
      item.totalImpressions, item.totalReach, item.totalResult, item.costPerResult,
    ]),
  ];
  return rows.map(row => row.map(value => {
    const text = String(value ?? '');
    const safe = /^(?:[\t\r\n]|\s*[=+@-])/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
}
