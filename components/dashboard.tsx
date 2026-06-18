'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, Clock, ExternalLink, Link2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EventCard } from './event-card';
import { CopyButton } from './copy-button';
import { Endpoint, WebhookEvent } from '@/lib/types';

interface DashboardProps {
  endpointId: string;
  readonly?: boolean;
}

function timeUntil(dateString: string): string {
  const diff = new Date(dateString).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function Dashboard({ endpointId, readonly = false }: DashboardProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setTick] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${endpointId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to load events');
        return;
      }
      const data = await res.json();
      setEndpoint(data.endpoint);
      setEvents((prev) => {
        const incoming: WebhookEvent[] = data.events;
        const newOnes = incoming.filter((e) => !knownIds.current.has(e.id));
        if (newOnes.length > 0 && !loading) {
          setNewCount((c) => c + newOnes.length);
          setTimeout(() => setNewCount(0), 4000);
        }
        incoming.forEach((e) => knownIds.current.add(e.id));
        return incoming;
      });
    } catch {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [endpointId, loading]);

  useEffect(() => {
    fetchEvents();
    timerRef.current = setInterval(fetchEvents, 2000);
    // Tick every minute to refresh relative timestamps
    const tickTimer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(tickTimer);
    };
  }, [fetchEvents]);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const catcherUrl = `${appUrl}/h/${endpoint?.id ?? endpointId}`;
  const dashboardUrl = `${appUrl}/d/${endpoint?.id ?? endpointId}`;
  const readonlyUrl = endpoint ? `${appUrl}/r/${endpoint.readonly_id}` : '';

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold text-destructive">
            {error === 'Endpoint expired' ? 'Endpoint expired' : 'Endpoint not found'}
          </p>
          <p className="text-sm text-muted-foreground">
            {error === 'Endpoint expired'
              ? 'This webhook catcher has expired. Endpoints auto-delete after 24 hours.'
              : 'This endpoint does not exist or has been deleted.'}
          </p>
          <a href="/" className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Generate a new endpoint
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-dots">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="text-sm font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity">
              hookcatch
            </a>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {endpoint && (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {timeUntil(endpoint.expires_at) === 'expired'
                      ? 'Expired'
                      : `Expires in ${timeUntil(endpoint.expires_at)}`}
                  </span>
                  {readonly && (
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      Read-only
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* URL bar */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 ring-1 ring-inset ring-white/5">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <code className="flex-1 text-xs font-mono text-foreground/90 truncate">{catcherUrl}</code>
              <CopyButton text={catcherUrl} />
            </div>

            <div className="flex gap-3 px-0.5">
              {!readonly && readonlyUrl && (
                <a
                  href={readonlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  Read-only link
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {!readonly && (
                <a
                  href={dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  Dashboard link
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Events */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Status bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-muted-foreground">Listening for webhooks</span>
            {newCount > 0 && (
              <span className="ml-1 rounded-full bg-green-500/20 text-green-400 text-xs px-2 py-0.5 font-medium">
                +{newCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 mb-5 shadow-sm">
              <Activity className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <p className="text-base font-semibold text-foreground">Waiting for webhooks</p>
            <p className="mt-2 text-sm text-muted-foreground/80 max-w-xs leading-relaxed">
              Copy the URL above and paste it as the webhook destination in any service.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground/60">
              {['Stripe', 'GitHub', 'Twilio', 'Shopify', 'Slack', 'Linear'].map((svc) => (
                <span
                  key={svc}
                  className="rounded-md border border-border/50 bg-muted/20 px-3 py-1.5"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} readonly={readonly} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
