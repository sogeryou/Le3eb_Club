export function latestBirthDate(now = new Date()) {
  const year = now.getUTCFullYear() - 18;
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(now.getUTCDate(), lastDay))).toISOString().slice(0, 10);
}

export function isAdultBirthDate(value: string, now = new Date()) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value) || value > latestBirthDate(now)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const nicknameUnits = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const decorations = [['★', '★'], ['☆', '☆'], ['『', '』']] as const;
const nicknameWords = /^(?:\p{L}\p{M}*|\p{Nd})+(?:[ _-](?:\p{L}\p{M}*|\p{Nd})+)*$/u;
const hasLetterOrDigit = (value: string) => /[\p{L}\p{Nd}]/u.test(value.replace(/ـ/g, ''));

export function normalizeNickname(value: string) {
  return value.replace(/^ +| +$/g, '').normalize('NFC');
}

export function isValidNickname(value: string) {
  if (value.length > 128 || /[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Zl}\p{Zp}]/u.test(value)) return false;
  const name = normalizeNickname(value);
  const framed = decorations.find(([start, end]) => name.startsWith(start) && name.endsWith(end));
  const body = framed ? name.slice(1, -1) : name;
  if (!nicknameWords.test(body) || body.split(/[ _-]/).some(word => !hasLetterOrDigit(word))) return false;
  const displayLength = Array.from(nicknameUnits.segment(name)).length;
  const meaningfulLength = Array.from(nicknameUnits.segment(body)).filter(({ segment }) => hasLetterOrDigit(segment)).length;
  return meaningfulLength >= 2 && displayLength <= 24;
}

export const REGISTRATION_AVATAR_LIMIT = 5 * 1024 * 1024;
export const DEFAULT_REGISTRATION_AVATAR = '/default-companion.svg';
