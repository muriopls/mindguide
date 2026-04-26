export const SUBJECTS = [
  { slug: 'mathematik',  labelDe: 'Mathematik',    labelEn: 'Mathematics' },
  { slug: 'deutsch',     labelDe: 'Deutsch',        labelEn: 'German' },
  { slug: 'englisch',    labelDe: 'Englisch',       labelEn: 'English' },
  { slug: 'physik',      labelDe: 'Physik',         labelEn: 'Physics' },
  { slug: 'chemie',      labelDe: 'Chemie',         labelEn: 'Chemistry' },
  { slug: 'biologie',    labelDe: 'Biologie',       labelEn: 'Biology' },
  { slug: 'geschichte',  labelDe: 'Geschichte',     labelEn: 'History' },
  { slug: 'geographie',  labelDe: 'Geographie',     labelEn: 'Geography' },
  { slug: 'informatik',  labelDe: 'Informatik',     labelEn: 'Computer Science' },
  { slug: 'kunst',       labelDe: 'Kunst',          labelEn: 'Art' },
  { slug: 'musik',       labelDe: 'Musik',          labelEn: 'Music' },
  { slug: 'ethik',       labelDe: 'Ethik',          labelEn: 'Ethics' },
] as const;

export type SubjectSlug = typeof SUBJECTS[number]['slug'];

export function getSubjectLabel(slug: SubjectSlug, locale: string): string {
  const subject = SUBJECTS.find((s) => s.slug === slug);
  if (!subject) return slug;
  return locale === 'en' ? subject.labelEn : subject.labelDe;
}

export function isValidSubjectSlug(slug: string): slug is SubjectSlug {
  return SUBJECTS.some((s) => s.slug === slug);
}
