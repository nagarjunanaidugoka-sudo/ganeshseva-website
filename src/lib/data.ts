// Static option lists only — no hardcoded data. All records live in Supabase.

export const EXPENSE_CATEGORIES = [
  'Pooja Materials',
  'Decoration',
  'Sound & Light',
  'Cultural Programme',
  'Prasadam',
  'Permissions',
  'Nimajjanam',
  'Miscellaneous',
];

export const DONATION_CATEGORIES = [
  'General Donation',
  'Pooja Sponsorship',
  'Idol Fund',
  'Decoration',
  'Sound & Light',
  'Cultural Programme',
  'Prasadam',
  'Nimajjanam',
  'Annadanam',
];

export const DONATION_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank', label: 'Bank Transfer' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'received', label: 'Received' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
] as const;

export const EVENT_TYPES = [
  { value: 'pooja', label: 'Pooja' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'competition', label: 'Competition' },
  { value: 'nimajjanam', label: 'Nimajjanam' },
  { value: 'seva', label: 'Seva' },
] as const;


