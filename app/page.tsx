'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, RotateCcw, ShieldCheck, Clock, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/endpoints', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create endpoint');
      const data = await res.json();
      router.push(`/d/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid-dots">
      {/* Nav */}
      <nav className="border-b border-border/60 px-6 py-4 backdrop-blur-sm">
        <span className="text-sm font-bold tracking-tight">hookcatch</span>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 relative">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            No signup. No configuration. Instant.
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Debug webhooks
            <br />
            <span className="text-muted-foreground/80">in real time.</span>
          </h1>

          <p className="mt-6 max-w-lg mx-auto text-lg text-muted-foreground leading-relaxed">
            Generate a unique URL, point any webhook at it, and watch every
            request arrive live. Inspect headers, replay events, verify
            signatures — no account required.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={generate}
              disabled={loading}
              className="h-12 px-8 text-base gap-2 shadow-lg shadow-white/5 transition-all hover:shadow-white/10"
            >
              {loading ? (
                'Generating...'
              ) : (
                <>
                  Generate webhook URL
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground/70">
              Endpoint auto-expires after 24 hours
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="relative mx-auto mt-24 w-full max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted-foreground/60 font-medium tracking-wider uppercase">Features</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: 'Live capture',
                desc: 'Any HTTP method, any payload. See every request within 2 seconds of it being sent.',
              },
              {
                icon: Eye,
                title: 'Full inspection',
                desc: 'Headers, body, source IP, query params — every detail of every request, pretty-printed.',
              },
              {
                icon: RotateCcw,
                title: 'Replay',
                desc: 'Resend the exact payload to your local server via ngrok, staging, or any target URL.',
              },
              {
                icon: ShieldCheck,
                title: 'Verify signatures',
                desc: 'Check Stripe, GitHub, or generic HMAC-SHA256 signatures. See computed vs received.',
              },
              {
                icon: Clock,
                title: 'Auto-expiry',
                desc: 'Endpoints and all captured data delete after 24 hours. No permanent logs of sensitive data.',
              },
              {
                icon: Share2,
                title: 'Read-only sharing',
                desc: 'Share a link that lets teammates see events without replay or signature access.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-lg border border-border/60 bg-card/50 p-4 space-y-2 transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-muted/60 p-1.5 group-hover:bg-muted transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed pl-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {/* Compatible services */}
          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground/50 mb-3 tracking-wide">Works with any webhook source</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Stripe', 'GitHub', 'Twilio', 'Shopify', 'Slack', 'Linear', 'PagerDuty', 'Vercel'].map((svc) => (
                <span
                  key={svc}
                  className="rounded-md border border-border/50 bg-muted/20 px-3 py-1 text-xs text-muted-foreground/70"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 py-4 text-center text-xs text-muted-foreground/50">
        hookcatch — open source webhook debugger
      </footer>
    </div>
  );
}
