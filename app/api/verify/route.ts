import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { VerificationResult } from '@/lib/types';

async function hmacSHA256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: NextRequest) {
  const { eventId, secret, scheme } = await request.json();

  if (!eventId || !secret || !scheme) {
    return NextResponse.json({ error: 'Missing eventId, secret, or scheme' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const headers = event.headers as Record<string, string>;
  const rawBody = event.body ?? '';
  let result: VerificationResult;

  if (scheme === 'stripe') {
    const sigHeader = headers['stripe-signature'] ?? headers['Stripe-Signature'] ?? '';
    if (!sigHeader) {
      result = {
        valid: false,
        scheme: 'Stripe',
        computedSignature: '',
        receivedSignature: '',
        details: 'No stripe-signature header found in captured request',
        error: 'Missing stripe-signature header',
      };
    } else {
      const parts: Record<string, string> = {};
      sigHeader.split(',').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx > -1) {
          parts[part.slice(0, idx)] = part.slice(idx + 1);
        }
      });
      const timestamp = parts['t'] ?? '';
      const receivedSig = parts['v1'] ?? '';
      const payload = `${timestamp}.${rawBody}`;
      const computedSig = await hmacSHA256(secret, payload);
      result = {
        valid: computedSig === receivedSig,
        scheme: 'Stripe HMAC-SHA256',
        computedSignature: computedSig,
        receivedSignature: receivedSig,
        details: `Signed payload: "${timestamp}.<body>"`,
      };
    }
  } else if (scheme === 'github') {
    const sigHeader =
      headers['x-hub-signature-256'] ?? headers['X-Hub-Signature-256'] ?? '';
    if (!sigHeader) {
      result = {
        valid: false,
        scheme: 'GitHub',
        computedSignature: '',
        receivedSignature: '',
        details: 'No x-hub-signature-256 header found in captured request',
        error: 'Missing x-hub-signature-256 header',
      };
    } else {
      const receivedSig = sigHeader.replace(/^sha256=/, '');
      const computedSig = await hmacSHA256(secret, rawBody);
      result = {
        valid: computedSig === receivedSig,
        scheme: 'GitHub HMAC-SHA256',
        computedSignature: `sha256=${computedSig}`,
        receivedSignature: sigHeader,
        details: 'Signed payload: raw request body',
      };
    }
  } else {
    // Generic HMAC-SHA256 — compare against any header containing a hex signature
    const computedSig = await hmacSHA256(secret, rawBody);
    const matchingHeader = Object.entries(headers).find(([, v]) =>
      v.toLowerCase().includes(computedSig)
    );
    result = {
      valid: !!matchingHeader,
      scheme: 'Generic HMAC-SHA256',
      computedSignature: computedSig,
      receivedSignature: matchingHeader ? matchingHeader[1] : '(not found in any header)',
      details: matchingHeader
        ? `Matched in header: ${matchingHeader[0]}`
        : 'Computed signature not found in any request header',
    };
  }

  return NextResponse.json(result);
}
