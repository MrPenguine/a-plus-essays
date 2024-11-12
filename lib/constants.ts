export const WORDS_PER_PAGE = 275;

export const ASSIGNMENT_TYPES = [
  { value: 'essay', label: 'Essay' },
  { value: 'research', label: 'Research Paper' },
  { value: 'thesis', label: 'Thesis' },
  { value: 'coursework', label: 'Coursework' },
  { value: 'dissertation', label: 'Dissertation' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'term_paper', label: 'Term Paper' },
  { value: 'book_report', label: 'Book Report' },
  { value: 'article', label: 'Article' },
  { value: 'presentation', label: 'Presentation' },
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

export const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
} as const;