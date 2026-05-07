'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Clock, Send, ExternalLink,
  Phone, Mail, MapPin, Briefcase, AlertCircle,
  ChevronRight, MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Submission = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  whatsapp_number: string;
  dedicated_gmail: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  subscription_start: string | null;
  subscription_end: string | null;
  current_month: number;
  total_applied: number;
  jobs_applied: string[];
  target_roles: string[] | null;
  experience_level: string | null;
  sector: string | null;
  admin_notes: string | null;
  created_at: string;
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Activation',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: <Clock className="w-4 h-4" />,
  },
  active: {
    label: 'Active',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  paused: {
    label: 'Paused',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    icon: <Clock className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-400',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export default function ApplyForMeDashboard() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [hasOnboarding, setHasOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: sub }, { data: onboarding }] = await Promise.all([
        supabase
          .from('apply_for_me_submissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('onboarding_data')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      setSubmission(sub ?? null);
      setHasOnboarding(!!onboarding);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  // ── No onboarding ────────────────────────────────────────
  if (!hasOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Complete your profile first</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We need your CV and job preferences before we can start applying on your behalf. It only takes a few minutes.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-gray-800"
          >
            Complete Onboarding
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── No submission yet (paid but not submitted, or direct visit) ───
  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">You haven't submitted your details yet</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Once you've paid, fill in your Gmail and WhatsApp details so we can get started.
          </p>
          <button
            onClick={() => router.push('/apply-for-me/submit')}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-gray-800"
          >
            Submit your details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[submission.status];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-amber-500 text-xs font-semibold tracking-widest uppercase mb-1">Apply for Me</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {submission.full_name ? `Hi, ${submission.full_name.split(' ')[0]}` : 'Your Dashboard'}
            </h1>
          </div>
          <a
            href="https://wa.me/2347056928186?text=Hi!%20I%20have%20a%20question%20about%20my%20Apply%20for%20Me%20subscription."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contact us
          </a>
        </div>

        {/* ── Status card ── */}
        <div className={`rounded-2xl border ${statusCfg.border} ${statusCfg.bg} p-6 flex items-start gap-4`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusCfg.color} bg-white border ${statusCfg.border} flex-shrink-0`}>
            {statusCfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${submission.status === 'active' ? 'animate-pulse' : ''}`} />
            </div>
            {submission.status === 'pending' && (
              <p className="text-sm text-amber-700/80">
                Your details have been received. We'll confirm your payment and activate your subscription within 24 hours.
              </p>
            )}
            {submission.status === 'active' && (
              <p className="text-sm text-emerald-700/80">
                We're actively applying on your behalf.
                {submission.subscription_end && ` Subscription runs until ${formatDate(submission.subscription_end)}.`}
              </p>
            )}
            {submission.status === 'paused' && (
              <p className="text-sm text-gray-500">Your subscription is currently paused. Contact us to resume.</p>
            )}
            {submission.status === 'cancelled' && (
              <p className="text-sm text-red-600/80">Your subscription has been cancelled. Contact us if this is a mistake.</p>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{submission.total_applied}</p>
            <p className="text-xs text-gray-400 mt-1">Jobs applied to</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">Month {submission.current_month}</p>
            <p className="text-xs text-gray-400 mt-1">Current month</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {submission.subscription_start ? formatDate(submission.subscription_start) : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Start date</p>
          </div>
        </div>

        {/* ── Jobs applied ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Jobs Applied To</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {submission.jobs_applied.length} total
            </span>
          </div>

          {submission.jobs_applied.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Send className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {submission.status === 'pending'
                  ? 'Applications will appear here once your subscription is activated.'
                  : 'No applications submitted yet this month.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submission.jobs_applied.map((url, i) => {
                let hostname = url;
                try { hostname = new URL(url).hostname.replace('www.', ''); } catch {}
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-500">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{hostname}</p>
                        <p className="text-xs text-gray-400 truncate">{url}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 ml-4 transition-colors" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Your details ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your Details</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { icon: <Mail className="w-4 h-4" />, label: 'Profile email', value: submission.email },
              { icon: <Mail className="w-4 h-4" />, label: 'Dedicated Gmail', value: submission.dedicated_gmail },
              { icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', value: submission.whatsapp_number },
              { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: submission.location || '—' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <span className="text-gray-300 flex-shrink-0">{row.icon}</span>
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{row.label}</span>
                <span className="text-sm text-gray-700 truncate">{row.value}</span>
              </div>
            ))}
            {submission.target_roles && submission.target_roles.length > 0 && (
              <div className="flex items-start gap-4 px-6 py-4">
                <Briefcase className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">Target roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {submission.target_roles.map((role, i) => (
                    <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Admin notes (only shown if present) ── */}
        {submission.admin_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Note from the team</p>
            <p className="text-sm text-blue-800 leading-relaxed">{submission.admin_notes}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Subscribed {formatDate(submission.created_at)} · Questions?{' '}
          <a
            href="https://wa.me/2347056928186"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            Chat with us
          </a>
        </p>

      </div>
    </div>
  );
}