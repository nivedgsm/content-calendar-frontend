type CalendarItem = {
  id: string;
  title: string;
  date: string;
  type?: string;
  platform?: string;
  status?: string;
  theme?: string | null;
  caption?: string | null;
  location?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  crew?: string | null;
  shotList?: string | null;
  notes?: string | null;
  client?: { name?: string; color?: string };
};

const ymd = (value: string) => new Date(value).toISOString().slice(0, 10).replaceAll('-', '');
const icsEscape = (value: unknown) => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

export function downloadCalendarIcs(items: CalendarItem[], month: string) {
  const events = items.map(item => {
    const date = ymd(item.date);
    const description = [item.client?.name, item.platform, item.type, item.status?.replaceAll('_', ' '), item.theme, item.caption].filter(Boolean).join(' Â· ');
    return ['BEGIN:VEVENT', `UID:${icsEscape(item.id)}@contentflow`, `DTSTAMP:${new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '')}`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${addOneDay(date)}`, `SUMMARY:${icsEscape(item.title)}`, `DESCRIPTION:${icsEscape(description)}`, 'END:VEVENT'].join('\r\n');
  });
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Contentflow//Content Calendar//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
  download(content, `contentflow-${month}.ics`, 'text/calendar;charset=utf-8');
}

function addOneDay(date: string) {
  const d = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8)) + 1));
  return d.toISOString().slice(0, 10).replaceAll('-', '');
}

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadShootCalendarIcs(items: CalendarItem[], month: string) {
  const events = items.map(item => {
    const date = ymd(item.date);
    const timed = Boolean(item.startTime);
    const start = timed ? `${date}T${item.startTime!.replace(':', '')}00` : date;
    const end = timed ? `${date}T${(item.endTime || item.startTime)!.replace(':', '')}00` : addOneDay(date);
    const details = [item.client?.name && `Client: ${item.client.name}`, item.crew && `Crew: ${item.crew}`, item.shotList && `Shot list: ${item.shotList}`, item.notes].filter(Boolean).join('\n');
    return ['BEGIN:VEVENT', `UID:${icsEscape(item.id)}@contentflow`, `DTSTAMP:${new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '')}`, `${timed ? 'DTSTART' : 'DTSTART;VALUE=DATE'}:${start}`, `${timed ? 'DTEND' : 'DTEND;VALUE=DATE'}:${end}`, `SUMMARY:${icsEscape(item.title)}`, `DESCRIPTION:${icsEscape(details)}`, ...(item.location ? [`LOCATION:${icsEscape(item.location)}`] : []), 'END:VEVENT'].join('\r\n');
  });
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Contentflow//Shoot Calendar//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
  download(content, `contentflow-shoots-${month}.ics`, 'text/calendar;charset=utf-8');
}

