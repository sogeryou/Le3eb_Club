import { useI18n } from '../i18n/I18nProvider';
import { AR_SOURCE_LABELS } from './source-labels';

/** Translate source copy without adding DOM wrappers or changing source geometry. */
export function SourceLabel({ text }: { text: string }) {
  const { locale } = useI18n();
  return locale === 'ar' ? (AR_SOURCE_LABELS[text] ?? text) : text;
}
