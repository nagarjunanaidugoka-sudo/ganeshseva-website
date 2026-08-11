export type Lang = 'en' | 'te';

export type EventType = 'pooja' | 'cultural' | 'competition' | 'nimajjanam' | 'seva';
export type GalleryType = 'photo' | 'video';
export type DonationMethod = 'cash' | 'upi' | 'cheque' | 'bank';
export type PaymentStatus = 'received' | 'pending' | 'failed';

export interface Settings {
  key: string;
  committee_name: string;
  committee_name_te: string;
  village: string;
  year: number;
  festival_date: string | null;
  president: string;
  donation_goal: number;
  logo_url: string;
  banner_url: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  upi_id: string;
  upi_qr_url: string;
  ganesh_image_url: string | null;
}

export interface Member {
  id: string;
  name: string;
  name_te: string;
  position: string;
  position_te: string;
  phone: string;
  photo: string;
  sort_order: number;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  business: string;
  contribution: number;
  phone: string;
  logo: string;
  sort_order: number;
  created_at: string;
}

export interface FestivalEvent {
  id: string;
  day: number;
  date: string | null;
  title: string;
  title_te: string;
  time: string;
  type: EventType;
  description: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string | null;
  pinned: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  type: GalleryType;
  title: string;
  album: string;
  url: string;
  thumbnail: string;
  date: string | null;
  sort_order: number;
  created_at: string;
}

export interface Donation {
  id: string;
  receipt_no: string;
  donor_name: string;
  donor_name_te: string;
  father_name: string;
  amount: number;
  method: DonationMethod;
  purpose: string;
  phone: string;
  date: string;
  payment_status: PaymentStatus;
  transaction_id: string | null;
  category: string;
  notes: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  payment_date: string | null;
  screenshot_url: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  bill_no: string;
  has_bill: boolean;
  notes: string | null;
  title: string | null;
  payment_method: DonationMethod;
  receipt_url: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export interface Donor {
  id: string;
  donor_id: string;
  name: string;
  father_name: string;
  phone: string;
  village: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string | null;
  action: 'insert' | 'update' | 'delete';
  changes: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export interface SiteContent {
  key: string;
  label: string;
  value_en: string;
  value_te: string;
  content_type: 'text' | 'rich';
  section: string;
  updated_by: string | null;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  content_key: string;
  value_en: string | null;
  value_te: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  announcement_id: string | null;
  link: string | null;
  sent_at: string;
  created_by: string | null;
}
