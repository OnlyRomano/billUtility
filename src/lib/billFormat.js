/** Fixed locale so SSR and browser render identical number strings. */
export const DISPLAY_LOCALE = "en-US";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseIsoToLocalDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const parts = iso.slice(0, 10).split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
}

export function formatReadingPeriodCompact(startIso, endIso) {
  const a = parseIsoToLocalDate(startIso);
  const b = parseIsoToLocalDate(endIso);
  if (!a || !b) return "—";
  return `${MONTH_SHORT[a.getMonth()]}${a.getDate()}-${MONTH_SHORT[b.getMonth()]}${b.getDate()}`;
}

export function formatDueDateForBill(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const d = parseIsoToLocalDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString(DISPLAY_LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function parseYearMonthString(raw) {
  const t = raw.trim();
  const match = t.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return "";
  const y = Number(match[1]);
  const mo = Number(match[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return "";
  return `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}`;
}

function formatLocalDateAsIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayIsoDate() {
  return formatLocalDateAsIso(new Date());
}

/** Default bill period: today through one calendar month later. */
export function getDefaultBillPeriodRange() {
  const start = getTodayIsoDate();
  return { start, end: addOneMonthToIsoDate(start) };
}

/** Returns ISO date one calendar month after start (same day when possible). */
export function addOneMonthToIsoDate(startIso) {
  const start = parseIsoToLocalDate(startIso);
  if (!start) return "";
  const y = start.getFullYear();
  const m = start.getMonth();
  const d = start.getDate();
  const targetMonth = m + 1;
  const targetYear = y + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return formatLocalDateAsIso(new Date(targetYear, normalizedMonth, day));
}

export function formatBillPeriodForBill(startIso, endIso) {
  const a = parseIsoToLocalDate(startIso);
  const b = parseIsoToLocalDate(endIso);
  const fmt = (d) =>
    d.toLocaleDateString(DISPLAY_LOCALE, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  if (a && b) return `${fmt(a)} - ${fmt(b)}`;
  if (a) return fmt(a);
  if (b) return fmt(b);
  return "—";
}

export function formatPHP(value) {
  const n = Number.isFinite(value) ? value : 0;
  return `PHP ${n.toLocaleString(DISPLAY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCount(value, maxFractionDigits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(DISPLAY_LOCALE, { maximumFractionDigits: maxFractionDigits });
}

export function clampNonNegative(n) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Validates YYYY-MM-DD; returns ISO string or "". */
export function parseIsoDateInput(raw) {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return "";
  return s;
}

export function clampIsoToRange(iso, min, max) {
  if (!iso) return "";
  let out = iso;
  if (min && out < min) out = min;
  if (max && out > max) out = max;
  return out;
}
