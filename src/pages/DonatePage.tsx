import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, Copy, Check, HandCoins, ArrowLeft, CheckCircle2,
  AlertCircle, Smartphone, ShieldCheck, X, ImageIcon, Loader2,
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

  if (loading) {
    return <Loader label={tc('common.loading', t('common.loading', lang))} />;
  }

  const upiId = settings?.upi_id || 'nagarjuna.goka@ybl';
  const upiQr = settings?.upi_qr_url || '';
  const committeeName =
    settings?.committee_name || tc('app.name', t('appName', lang));

  function copyUpiId() {
    if (!upiId) return;

    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function payNow() {
    const amount = Number(form.amount);

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      setErrors(prev => ({
        ...prev,
        amount: 'Enter a valid donation amount first',
      }));
      return;
    }

    setErrors(prev => {
      const next = { ...prev };
      delete next.amount;
      return next;
    });

    const params = new URLSearchParams({
      pa: upiId,
      pn: committeeName,
      am: amount.toFixed(2),
      cu: 'INR',
    });

    window.location.href = `upi://pay?${params.toString()}`;
  }

  function validate(f: SubmitForm): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!f.donor_name.trim()) {
      errs.donor_name = 'Name is required';
    }

    if (!f.amount || Number(f.amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }

    if (f.phone && !/^[0-9+\-\s]{6,15}$/.test(f.phone)) {
      errs.phone = 'Enter a valid phone number';
    }

    if (!f.transaction_id.trim()) {
      errs.transaction_id = 'Transaction ID is required';
    }

    if (!f.payment_date) {
      errs.payment_date = 'Payment date is required';
    }

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
    const filename =
      `donations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error: uploadErr } = await supabase.storage
      .from('image-uploads')
      .upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadErr || !data) {
      setUploadError(uploadErr?.message ?? 'Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('image-uploads')
      .getPublicUrl(data.path);

    setForm(f => ({ ...f, screenshot_url: publicUrl }));
    setUploading(false);
  }

  function removeScreenshot() {
    setForm(f => ({ ...f, screenshot_url: null }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        p_payment_date: form.payment_date
          ? new Date(form.payment_date).toISOString()
          : new Date().toISOString(),
        p_screenshot_url: form.screenshot_url,
        p_father_name: form.father_name.trim() || null,
      });

      if (error) throw error;

      if (data) {
        setSubmitted(true);
      }
    } catch {
      setSubmitError(
        'Could not submit your payment details. Please try again or contact the committee.'
      );
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
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* DIRECT UPI PAYMENT */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 text-saffron-300/20">
          <Mandala className="w-full h-full animate-spin-slow" />
        </div>

        <div className="relative space-y-4">

          <div>
            <h3 className="font-display text-lg font-semibold text-maroon-800 dark:text-gold-200">
              Pay Directly with UPI
            </h3>

            <p className="text-sm text-maroon-500 dark:text-cream/60 mt-1">
              Enter your donation amount and tap Pay Now. Your UPI app will open
              with the payment amount filled in.
            </p>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">

            <div>
              <label className="label">
                Donation Amount (₹) <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="1"
                step="1"
                inputMode="decimal"
                value={form.amount}
                onChange={e => {
                  setForm({
                    ...form,
                    amount: e.target.value,
                  });

                  if (errors.amount) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.amount;
                      return next;
                    });
                  }
                }}
                className="input text-lg"
                placeholder="Enter amount"
              />

              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={payNow}
              className="btn-primary px-6 py-3 whitespace-nowrap"
            >
              <Smartphone className="w-5 h-5" />
              Pay Now
            </button>

          </div>

          <div className="flex items-center gap-2 text-xs text-maroon-500 dark:text-cream/60">
            <ShieldCheck className="w-4 h-4 text-saffron-500 shrink-0" />

            UPI ID:
            <span className="font-mono font-medium">
              {upiId}
            </span>
          </div>

          <p className="text-xs text-maroon-400 dark:text-cream/50">
            After completing payment, return here and submit your transaction
            details below so the committee can verify your donation.
          </p>

        </div>
      </Card>

      {/* QR + UPI ID */}
      <Card className="relative overflow-hidden">

        <div className="absolute -right-8 -top-8 w-28 h-28 text-saffron-300/20">
          <Mandala className="w-full h-full animate-spin-slow" />
        </div>

        <div className="absolute -left-6 -bottom-6 w-20 h-20 text-lotus-300/20">
          <Lotus className="w-full h-full" />
        </div>

        <div className="relative grid md:grid-cols-2 gap-6 items-center">

          <div className="flex flex-col items-center gap-3">

            {upiQr ? (
              <div className="relative">

                <div className="absolute inset-0 rounded-2xl bg-saffron-gradient opacity-20 blur-xl" />

                <div className="relative h-64 w-64 rounded-2xl bg-white p-3 shadow-glow-saffron">

                  <img
                    src={upiQr}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />

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

            <Badge color="saffron">
              Scan to Pay
            </Badge>

          </div>

          <div className="space-y-4">

            <div>

              <p className="text-xs uppercase tracking-wide text-maroon-500 dark:text-cream/60 font-semibold mb-1">
                UPI ID
              </p>

              <div className="flex items-center gap-2">

                <p className="text-lg font-mono font-medium text-maroon-800 dark:text-gold-200 break-all flex-1">
                  {upiId || 'Not configured'}
                </p>

                {upiId && (
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="btn-outline px-3 py-2 text-sm shrink-0"
                    aria-label="Copy UPI ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}

                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}

              </div>

            </div>

            <div className="space-y-2 text-sm text-maroon-600 dark:text-cream/70">

              <p className="font-semibold text-maroon-800 dark:text-gold-200">
                Payment Instructions:
              </p>

              <ol className="list-decimal list-inside space-y-1.5">
                <li>Enter the donation amount above and tap Pay Now</li>
                <li>Your UPI app will open with the amount pre-filled</li>
                <li>Complete the payment in your UPI app</li>
                <li>Return here and note the Transaction Reference ID</li>
                <li>Tap "Submit Payment Details" below</li>
              </ol>

            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-saffron-50 dark:bg-maroon-800/60 border border-saffron-200/60 dark:border-maroon-700">

              <ShieldCheck className="w-5 h-5 text-saffron-600 dark:text-gold-300 shrink-0 mt-0.5" />

              <p className="text-xs text-maroon-600 dark:text-cream/70">
                Your payment goes directly to the committee's UPI account.
                Submitting details here helps the committee verify your contribution.
              </p>

            </div>

          </div>

        </div>
      </Card>

      {/* SUBMIT PAYMENT DETAILS */}
      {!showForm && !submitted && (
        <Card className="text-center">

          <div className="flex flex-col items
