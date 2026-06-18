'use client';

import { useState } from 'react';
import { RotateCcw, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebhookEvent } from '@/lib/types';
import { MethodBadge } from './method-badge';

interface ReplayDialogProps {
  event: WebhookEvent;
}

type ReplayStatus = 'idle' | 'loading' | 'success' | 'error';

export function ReplayDialog({ event }: ReplayDialogProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState<ReplayStatus>('idle');
  const [result, setResult] = useState<{ status: number; statusText: string; ok: boolean } | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function replay() {
    if (!targetUrl) return;
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/replay', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Replay failed');
      } else {
        setStatus('success');
        setResult(data);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          <RotateCcw className="h-3 w-3" />
          Replay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MethodBadge method={event.method} />
            <span className="text-sm font-normal text-muted-foreground">Replay webhook</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Resend the exact same payload to a different URL. Useful for replaying production
            webhooks against your local dev server via ngrok or a staging endpoint.
          </p>

          <div className="space-y-2">
            <Label htmlFor="target-url">Target URL</Label>
            <Input
              id="target-url"
              placeholder="https://your-ngrok-url.ngrok.io/webhook"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && replay()}
            />
          </div>

          {status === 'success' && result && (
            <div className={`rounded-md border p-3 text-sm ${result.ok ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'}`}>
              <span className="font-semibold">{result.status} {result.statusText}</span>
              {result.ok ? ' — Success' : ' — Non-2xx response'}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={replay}
              disabled={!targetUrl || status === 'loading'}
              className="flex-1"
            >
              {status === 'loading' ? (
                'Replaying...'
              ) : (
                <>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Send replay
                </>
              )}
            </Button>
            {status !== 'idle' && (
              <Button variant="outline" onClick={reset}>Reset</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
