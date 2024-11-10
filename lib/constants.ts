export const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
} as const;

export const WORDS_PER_PAGE = 275;

export const ASSIGNMENT_TYPES = [
  { value: 'essay', label: 'Essay' },
  { value: 'research', label: 'Research Paper' },
  { value: 'thesis', label: 'Thesis' },
  { value: 'coursework', label: 'Coursework' },
  { value: 'other', label: 'Other' }
] as const;

export const SUBJECTS = [
  'English',
  'Business',
  'Nursing',
  'History',
  'Psychology',
  'Sociology',
  'Philosophy',
  'Economics',
  'Marketing',
  'Other'
] as const;