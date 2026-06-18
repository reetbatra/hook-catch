'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WebhookEvent, VerificationResult } from '@/lib/types';

interface VerifyDialogProps {
  event: WebhookEvent;
}

type VerifyStatus = 'idle' | 'loading' | 'done' | 'error';

export function VerifyDialog({ event }: VerifyDialogProps) {
  const [secret, setSecret] = useState('');
  const [scheme, setScheme] = useState('stripe');
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function verify() {
    if (!secret) return;
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, secret, scheme }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Verification failed');
      } else {
        setStatus('done');
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
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" />}>
        <ShieldCheck className="h-3 w-3" />
        Verify
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verify webhook signature
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste your webhook secret to check whether the captured signature is valid.
            Your secret never leaves your browser.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Scheme</Label>
              <Select value={scheme} onValueChange={(v) => v && setScheme(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe (HMAC-SHA256)</SelectItem>
                  <SelectItem value="github">GitHub (HMAC-SHA256)</SelectItem>
                  <SelectItem value="generic">Generic HMAC-SHA256</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Webhook secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="whsec_..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verify()}
              />
            </div>
          </div>

          {status === 'done' && result && (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 rounded-md border p-3 ${result.valid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <span className={`text-lg ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {result.valid ? '✓' : '✗'}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? 'Signature is valid' : 'Signature is invalid'}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.scheme} — {result.details}</p>
                </div>
              </div>

              {result.error && (
                <p className="text-xs text-yellow-400">{result.error}</p>
              )}

              {(result.computedSignature || result.receivedSignature) && (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Computed</p>
                    <code className="block text-xs font-mono break-all text-foreground">
                      {result.computedSignature || '—'}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Received</p>
                    <code className="block text-xs font-mono break-all text-foreground">
                      {result.receivedSignature || '—'}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={verify}
              disabled={!secret || status === 'loading'}
              className="flex-1"
            >
              {status === 'loading' ? 'Verifying...' : 'Verify signature'}
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
