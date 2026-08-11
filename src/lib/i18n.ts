import type { Lang } from './types';

export const STRINGS = {
  appName: { en: 'GaneshSeva', te: 'గణేశ్‌సేవ' },
  tagline: { en: 'Vinayaka Committee Management', te: 'వినాయక కమిటీ నిర్వహణ' },
  nav: {
    home: { en: 'Home', te: 'హోమ్' },
    dashboard: { en: 'Dashboard', te: 'డాష్‌బోర్డ్' },
    donations: { en: 'Donations', te: 'విరాళాలు' },
    expenses: { en: 'Expenses', te: 'ఖర్చులు' },
    sponsors: { en: 'Sponsors', te: 'స్పాన్సర్లు' },
    committee: { en: 'Committee', te: 'కమిటీ' }, // kept for t() calls in legacy code but nav item removed
    events: { en: 'Events', te: 'కార్యక్రమాలు' },
    gallery: { en: 'Gallery', te: 'గ్యాలరీ' },
    contact: { en: 'Contact', te: 'సంప్రదించండి' },
    login: { en: 'Login', te: 'లాగిన్' },
  },
  home: {
    welcome: { en: 'Welcome to', te: 'స్వాగతం' },
    countdown: { en: 'Festival Countdown', te: 'పండుగ కౌంట్‌డౌన్' },
    liveDonations: { en: 'Live Donation Total', te: 'ప్రత్యక్ష విరాళ మొత్తం' },
    availableBalance: { en: 'Available Balance', te: 'అందుబాటులో ఉన్న నిధి' },
    quickDonate: { en: 'Quick Donate', te: 'త్వరిత విరాళం' },
    eventHighlights: { en: 'Event Highlights', te: 'కార్యక్రమ ముఖ్యాంశాలు' },
    sponsorsPreview: { en: 'Our Sponsors', te: 'మా స్పాన్సర్లు' },
    galleryPreview: { en: 'Gallery Preview', te: 'గ్యాలరీ ప్రివ్యూ' },
    committeeIntro: { en: 'About the Committee', te: 'కమిటీ గురించి' },
    announcements: { en: 'Latest Announcements', te: 'తాజా ప్రకటనలు' },
    viewAll: { en: 'View All', te: 'అన్నీ చూడండి' },
    days: { en: 'Days', te: 'రోజులు' },
    hours: { en: 'Hours', te: 'గంటలు' },
    minutes: { en: 'Minutes', te: 'నిమిషాలు' },
    seconds: { en: 'Seconds', te: 'సెకన్లు' },
  },
  common: {
    search: { en: 'Search...', te: 'వెతకండి...' },
    add: { en: 'Add', te: 'జోడించండి' },
    cancel: { en: 'Cancel', te: 'రద్దు' },
    save: { en: 'Save', te: 'సేవ్' },
    close: { en: 'Close', te: 'మూసివేయి' },
    noData: { en: 'No data available', te: 'డేటా లేదు' },
    loading: { en: 'Loading...', te: 'లోడ్ అవుతోంది...' },
    total: { en: 'Total', te: 'మొత్తం' },
    recent: { en: 'Recent', te: 'ఇటీవల' },
    date: { en: 'Date', te: 'తేదీ' },
    amount: { en: 'Amount', te: 'మొత్తం' },
    name: { en: 'Name', te: 'పేరు' },
    phone: { en: 'Phone', te: 'ఫోన్' },
    viewDetails: { en: 'View Details', te: 'వివరాలు చూడండి' },
  },
} as const;

export function t(path: string, lang: Lang): string {
  const keys = path.split('.');
  let cur: unknown = STRINGS;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in cur) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return path;
    }
  }
  if (cur && typeof cur === 'object' && lang in cur) {
    return String((cur as Record<string, string>)[lang]);
  }
  return path;
}
