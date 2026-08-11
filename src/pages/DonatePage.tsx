import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, Copy, Check, HandCoins, ArrowLeft, CheckCircle2,
  AlertCircle, Smartphone, ShieldCheck, Upload, X, ImageIcon, Loader2,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useData } from '@/lib/data-context';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useContent } from '@/lib/content-context';
import { Card, Badge, SectionHeading, Loader } from '@/components/ui';
import { Mandala, Lotus, Diya } from '@/components/decor/Decor';

interface SubmitForm {
  donor_name: string;
  father_name: string;
  phone: string;
  amount: string;
  transaction_id: string;
  payment_date: string;
  screenshot_url: string | null;
}

const emptyForm: SubmitForm = {
  donor_name: '',
  father_name: '',
  phone: '',
  amount: '',
  transaction_id: '',
  payment_date: new Date().toISOString().slice(0, 10),
  screenshot_url: null,
};

export function DonatePage() {
  const { lang } = useApp();
  const { settings, loading } = useData();
  const { tc } = useContent();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubmitForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <Loader label={tc('common.loading', t('common.loading', lang))} />;

  const upiId = settings?.upi_id || '';
  const upiQr = settings?.upi_qr_url || '';
  const committeeName = settings?.committee_name || tc('app.name', t('appName', lang));

  function copyUpiId() {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function validate(f: SubmitForm): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!f.donor_name.trim()) errs.donor_name = 'Name is required';
    if (!f.amount || Number(f.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (f.phone && !/^[0-9+\-\s]{6,15}$/.test(f.phone)) errs.phone = 'Enter a valid phone number';
    if (!f.transaction_id.trim()) errs.transaction_id = 'Transaction ID is required';
    if (!f.payment_date) errs.payment_date = 'Payment date is required';
    return errs;
  }

  async function handleScreenshot(file: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5 MB.');
      return;
    }
    setUploadError('');
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `donations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error: uploadErr } = await supabase.storage
      .from('image-uploads')
      .upload(filename, file, { upsert: true, contentType: file.type });
    if (uploadErr || !data) {
      setUploadError(uploadErr?.message ?? 'Upload failed. Please try again.');
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('image-uploads').getPublicUrl(data.path);
    setForm((f) => ({ ...f, screenshot_url: publicUrl }));
    setUploading(false);
  }

  function removeScreenshot() {
    setForm((f) => ({ ...f, screenshot_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const { data, error } = await supabase.rpc('submit_public_donation', {
        p_donor_name: form.donor_name.trim(),
        p_phone: form.phone.trim(),
        p_amount: Number(form.amount),
        p_transaction_id: form.transaction_id.trim(),
        p_payment_date: form.payment_date ? new Date(form.payment_date).toISOString() : new Date().toISOString(),
        p_screenshot_url: form.screenshot_url,
        p_father_name: form.father_name.trim() || null,
      });
      if (error) throw error;
      if (data) {
        setSubmitted(true);
      }
    } catch {
      setSubmitError('Could not submit your payment details. Please try again or contact the committee.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading
        title="Quick Donate"
        subtitle={`Support ${committeeName} via UPI`}
        action={
          <button onClick={() => navigate(-1)} className="btn-ghost px-4 py-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* QR + UPI ID card */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 text-saffron-300/20"><Mandala className="w-full h-full animate-spin-slow" /></div>
        <div className="absolute -left-6 -bottom-6 w-20 h-20 text-lotus-300/20"><Lotus className="w-full h-full" /></div>

        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            {upiQr ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-saffron-gradient opacity-20 blur-xl" />
                <div className="relative h-64 w-64 rounded-2xl bg-white p-3 shadow-glow-saffron">
                  <img src={upiQr} alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            ) : (
              <div className="h-64 w-64 rounded-2xl bg-saffron-50 dark:bg-maroon-800 flex flex-col items-center justify-center text-saffron-400 gap-2">
                <QrCode className="w-20 h-20" />
                <p className="text-sm text-maroon-500 dark:text-cream/60 text-center px-4">
                  QR code not uploaded yet. Please use the UPI ID below.
                </p>
              </div>
            )}
            <Badge color="saffron">Scan to Pay</Badge>
          </div>

          {/* UPI ID + instructions */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold mb-1">UPI ID</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-medium text-maroon-800 dark:text-gold-200 break-all flex-1">{upiId || 'Not configured'}</p>
                {upiId && (
                  <button
                    onClick={copyUpiId}
                    className="btn-outline px-3 py-2 text-sm shrink-0"
                    aria-label="Copy UPI ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-maroon-600 dark:text-cream/70">
              <p className="font-semibold text-maroon-800 dark:text-gold-200">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                <li>Scan the QR code or enter the UPI ID above</li>
                <li>Enter your donation amount and complete the payment</li>
                <li>Note down the Transaction Reference ID from your payment app</li>
                <li>Tap "Submit Payment Details" below to inform the committee</li>
              </ol>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-saffron-50 dark:bg-maroon-800/60 border border-saffron-200/60 dark:border-maroon-700">
              <ShieldCheck className="w-5 h-5 text-saffron-600 dark:text-gold-300 shrink-0 mt-0.5" />
              <p className="text-xs text-maroon-600 dark:text-cream/70">
                Your payment goes directly to the committee's UPI account. Submitting details here helps the committee verify your contribution.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Payment Details section */}
      {!showForm && !submitted && (
        <Card className="text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-saffron-gradient flex items-center justify-center text-white shadow-glow-saffron">
              <HandCoins className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">Already Paid?</h3>
              <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">
                Submit your payment details so the committee can verify your donation.
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-3 mt-1">
              <HandCoins className="w-5 h-5" /> Submit Payment Details
            </button>
          </div>
        </Card>
      )}

      {/* Submission form */}
      {showForm && !submitted && (
        <Card className="relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 text-saffron-400/20"><Diya className="w-full h-full animate-flicker" /></div>
          <div className="relative">
            <h3 className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200 mb-4">Submit Payment Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your Name <span className="text-red-500">*</span></label>
                  <input
                    value={form.donor_name}
                    onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                    className="input"
                    placeholder="Enter your name"
                  />
                  {errors.donor_name && <p className="text-xs text-red-500 mt-1">{errors.donor_name}</p>}
                </div>
                <div>
                  <label className="label">Father's Name (optional)</label>
                  <input
                    value={form.father_name}
                    onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                    className="input"
                    placeholder="e.g. Suresh"
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                    placeholder="98480XXXXX"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Donation Amount (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="label">Payment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    className="input"
                  />
                  {errors.payment_date && <p className="text-xs text-red-500 mt-1">{errors.payment_date}</p>}
                </div>
              </div>

              <div>
                <label className="label">Transaction ID <span className="text-red-500">*</span></label>
                <input
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  className="input"
                  placeholder="UPI reference number"
                />
                {errors.transaction_id && <p className="text-xs text-red-500 mt-1">{errors.transaction_id}</p>}
              </div>

              <div>
                <label className="label">Payment Screenshot (optional)</label>
                <p className="text-xs text-maroon-400 dark:text-cream/50 -mt-1 mb-2">Upload a screenshot of your payment confirmation to help the admin verify faster.</p>
                {form.screenshot_url ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-saffron-200 dark:border-maroon-700 bg-saffron-50 dark:bg-maroon-900/40 max-w-xs">
                    <img src={form.screenshot_url} alt="Payment screenshot" className="w-full object-contain" />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                      aria-label="Remove screenshot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-saffron-300 dark:border-maroon-700 bg-saffron-50/60 dark:bg-maroon-900/30 p-6 cursor-pointer hover:border-saffron-500 hover:bg-saffron-100/60 dark:hover:bg-maroon-800/40 transition-all"
                  >
                    {uploading ? (
                      <><Loader2 className="w-6 h-6 text-saffron-500 animate-spin" /><p className="text-sm text-maroon-500 dark:text-cream/60">Uploading…</p></>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-xl bg-saffron-100 dark:bg-maroon-800 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-saffron-500" />
                        </div>
                        <p className="text-sm font-medium text-maroon-700 dark:text-cream/80">
                          <span className="text-saffron-600 dark:text-saffron-300">Click to upload</span> payment screenshot
                        </p>
                        <p className="text-xs text-maroon-400 dark:text-cream/50">JPG, PNG, WebP · max 5 MB</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleScreenshot(f);
                    e.target.value = '';
                  }}
                />
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-200">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="btn-ghost px-5 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...
                    </span>
                  ) : 'Submit Details'}
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Success confirmation */}
      {submitted && (
        <Card className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-maroon-800 dark:text-gold-200">Payment Details Submitted!</h3>
              <p className="text-sm text-maroon-500 dark:text-cream/60 mt-2 max-w-md">
                Thank you for your donation. The committee will verify your payment and confirm it shortly. Your generosity is deeply appreciated.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => navigate('/')} className="btn-primary px-5 py-2.5">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </button>
              <button
                onClick={() => { setSubmitted(false); setShowForm(false); setForm({ ...emptyForm, payment_date: new Date().toISOString().slice(0, 10) }); }}
                className="btn-outline px-5 py-2.5"
              >
                <Smartphone className="w-4 h-4" /> Donate Again
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
