import React, { useEffect, useState } from 'react';

interface FeedbackEntry {
  name: string;
  email: string;
  message: string;
  date: string;
}

const STORAGE_KEY = 'axyomis_feedback_entries';
const OWNER_EMAIL = 'support@axyomis.app';

export const FeedbackSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persistEntries = (newEntries: FeedbackEntry[]) => {
    setEntries(newEntries);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    }
  };

  const buildEmailHtml = () => {
    return `
      <div style="font-family: Inter, system-ui, sans-serif; color:#f8fafc; background:#0b1220; padding:24px; border-radius:18px;">
        <h2 style="margin:0 0 12px; font-size:20px; color:#7dd3fc;">Axyomis Feedback</h2>
        <p style="margin:0 0 16px; color:#cbd5e1;">A user submitted feedback while the app is in maintenance mode.</p>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${name || 'Anonymous'}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${email || 'Not provided'}</p>
        <div style="margin-top:16px; padding:14px; border-radius:12px; background:#020617; color:#e2e8f0;">
          <strong>Feedback message</strong>
          <p style="margin:8px 0 0; white-space:pre-wrap; line-height:1.6;">${message.trim()}</p>
        </div>
      </div>
    `;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');

    if (!message.trim()) {
      setStatus('Please enter your feedback before sending.');
      return;
    }

    const newEntry: FeedbackEntry = {
      name: name.trim() || 'Anonymous',
      email: email.trim() || 'Not provided',
      message: message.trim(),
      date: new Date().toISOString(),
    };

    persistEntries([newEntry, ...entries].slice(0, 10));
    setSending(true);

    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: OWNER_EMAIL,
          reportHtml: buildEmailHtml(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus(
          'Thank you! Your feedback is submitted. If email sending is not configured, the app will keep the message stored locally.'
        );
        setMessage('');
      } else {
        setStatus(data.message || 'Unable to send feedback right now. Your message is saved locally.');
      }
    } catch (error) {
      setStatus('Could not reach the feedback service. Your message is saved locally.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="feedback-section" className="max-w-7xl mx-auto px-4 sm:px-8 mb-32">
      <div className="rounded-[42px] border border-white/10 bg-slate-950/60 p-8 sm:p-10 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.5em] text-cyan-400 font-black">MAINTENANCE FEEDBACK</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white">Share helpful feedback while we improve the app.</h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              The app is under maintenance and some features may not work yet. Submit your feedback below so the owner can review it and make the experience smoother.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black">Owner note</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Feedback is recorded locally and sent via the app's reporting service when possible. Any submission helps improve the next release.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Your name or alias"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Optional contact email"
                  type="email"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Feedback message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 min-h-[170px] w-full rounded-[32px] border border-white/10 bg-slate-950/90 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-400"
                placeholder="Describe what is not working or what we can improve..."
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center rounded-3xl bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Feedback'}
              </button>
              <p className="text-[11px] text-slate-500">Target: {OWNER_EMAIL}</p>
            </div>
            {status ? <p className="text-sm text-slate-300">{status}</p> : null}
          </form>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black">Recent submissions</p>
                <p className="text-[11px] text-slate-500 mt-2">Saved in your browser for fast access.</p>
              </div>
            </div>
            <div className="space-y-4 max-h-[330px] overflow-y-auto pr-2">
              {entries.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 text-slate-500 text-sm">
                  No feedback has been submitted yet.
                </div>
              ) : (
                entries.slice(0, 4).map((entry, index) => (
                  <div key={index} className="rounded-3xl border border-white/5 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">
                      <span>{entry.name}</span>
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300 break-words">{entry.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
