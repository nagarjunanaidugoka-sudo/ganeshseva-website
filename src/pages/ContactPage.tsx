import { Phone, Mail, MessageCircle, MapPin, Send, Clock, QrCode } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import { Card, Badge, SectionHeading, Loader } from '@/components/ui';
import { Mandala, Lotus, Diya } from '@/components/decor/Decor';

export function ContactPage() {
  const { lang } = useApp();
  const { settings, loading } = useData();
  const { tc } = useContent();
  const googleMapsUrl = tc('contact.google_maps_url', '');

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const address = settings?.address || '';
  const whatsapp = settings?.whatsapp || '';
  const upiId = settings?.upi_id || '';
  const upiQr = settings?.upi_qr_url || '';

  return (
    <div className="space-y-8 pb-10">
      <SectionHeading title={tc('nav.contact', t('nav.contact', lang))} subtitle="Get in touch with the committee" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 text-saffron-300/20"><Mandala className="w-full h-full animate-spin-slow" /></div>
          <div className="relative space-y-5">
            {phone && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-saffron-gradient flex items-center justify-center text-white shadow-glow-saffron">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold">Phone</p>
                  <a href={`tel:${phone}`} className="text-lg font-medium text-maroon-800 dark:text-gold-200 hover:text-saffron-600 transition">{phone}</a>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center text-maroon-950 shadow-glow-gold">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold">Email</p>
                  <a href={`mailto:${email}`} className="text-lg font-medium text-maroon-800 dark:text-gold-200 hover:text-saffron-600 transition break-all">{email}</a>
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-maroon-gradient flex items-center justify-center text-cream shadow-glow-maroon">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold">Address</p>
                  <p className="text-lg font-medium text-maroon-800 dark:text-gold-200">{address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center text-saffron-600 dark:text-gold-300">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold">Festival Hours</p>
                <p className="text-lg font-medium text-maroon-800 dark:text-gold-200">6:00 AM – 10:00 PM (9 days)</p>
              </div>
            </div>

            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn-maroon w-full py-3 mt-2">
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="relative h-full min-h-[22rem] bg-saffron-50 dark:bg-maroon-900 flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 text-saffron-400">
              <Mandala className="w-full h-full" />
            </div>
            <div className="relative text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-saffron-gradient flex items-center justify-center text-white shadow-glow-saffron animate-float">
                <MapPin className="w-8 h-8" />
              </div>
              <p className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200">Google Maps</p>

<p className="text-sm text-maroon-500 dark:text-cream/60 max-w-xs">
  {address || 'View the committee location on Google Maps'}
</p>

{googleMapsUrl ? (
  <a
    href={googleMapsUrl}
    target="_blank"
    rel="noreferrer"
    className="btn-primary px-5 py-2.5"
  >
    <MapPin className="w-4 h-4" />
    Open in Google Maps
  </a>
) : (
  <Badge color="saffron">Location not configured</Badge>
)}
            </div>
          </div>
        </Card>
      </div>

      {/* UPI / Bank details */}
      {(upiId || settings?.bank_name) && (
        <div className="grid lg:grid-cols-2 gap-5">
          {upiId && (
            <Card className="relative overflow-hidden">
              <div className="absolute -left-8 -bottom-8 w-28 h-28 text-lotus-300/20"><Lotus className="w-full h-full" /></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-saffron-500" />
                  <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">UPI Donation</h3>
                </div>
                <p className="text-sm text-maroon-600 dark:text-cream/70 mb-3">Scan to donate via UPI</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {upiQr ? (
                    <div className="h-40 w-40 rounded-xl bg-white p-2 shadow-glass shrink-0">
                      <img src={upiQr} alt="UPI QR Code" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-40 w-40 rounded-xl bg-saffron-50 dark:bg-maroon-800 flex items-center justify-center text-saffron-400 shrink-0">
                      <QrCode className="w-16 h-16" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold">UPI ID</p>
                    <p className="text-lg font-mono font-medium text-maroon-800 dark:text-gold-200 break-all">{upiId}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {settings?.bank_name && (
            <Card className="relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-20 h-20 text-saffron-400/20"><Diya className="w-full h-full animate-flicker" /></div>
              <div className="relative">
                <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200 mb-3">Bank Account Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-maroon-500 dark:text-cream/60">Account Name</dt>
                    <dd className="font-medium text-maroon-800 dark:text-cream text-right">{settings.bank_account_name || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-maroon-500 dark:text-cream/60">Account Number</dt>
                    <dd className="font-mono font-medium text-maroon-800 dark:text-cream text-right">{settings.bank_account_number || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-maroon-500 dark:text-cream/60">Bank</dt>
                    <dd className="font-medium text-maroon-800 dark:text-cream text-right">{settings.bank_name || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-maroon-500 dark:text-cream/60">IFSC</dt>
                    <dd className="font-mono font-medium text-maroon-800 dark:text-cream text-right">{settings.bank_ifsc || '—'}</dd>
                  </div>
                </dl>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 w-28 h-28 text-lotus-300/20"><Lotus className="w-full h-full" /></div>
        <div className="absolute -right-6 -top-6 w-20 h-20 text-saffron-400/20"><Diya className="w-full h-full animate-flicker" /></div>
        <div className="relative">
          <h3 className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200 mb-4">Send a Message</h3>
          <form onSubmit={(e) => { e.preventDefault(); alert('Message sent! (demo)'); }} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Your Name</label>
              <input required className="input" placeholder="Enter your name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="98480XXXXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Message</label>
              <textarea required className="input min-h-[120px]" placeholder="Write your message..." />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary px-6 py-3"><Send className="w-5 h-5" /> Send Message</button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
