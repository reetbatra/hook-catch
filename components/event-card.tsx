'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookEvent } from '@/lib/types';
import { MethodBadge } from './method-badge';
import { ReplayDialog } from './replay-dialog';
import { VerifyDialog } from './verify-dialog';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/utils';

const METHOD_ACCENT: Record<string, string> = {
  GET:     'border-l-blue-500/40',
  POST:    'border-l-green-500/40',
  PUT:     'border-l-orange-500/40',
  PATCH:   'border-l-yellow-500/40',
  DELETE:  'border-l-red-500/40',
  HEAD:    'border-l-purple-500/40',
  OPTIONS: 'border-l-gray-500/40',
};

interface EventCardProps {
  event: WebhookEvent;
  readonly?: boolean;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function bodyPreview(event: WebhookEvent): string {
  if (!event.body) return '(empty body)';
  const preview = event.body.slice(0, 120);
  return preview.length < event.body.length ? preview + '…' : preview;
}

function prettyJSON(str: string | null): string {
  if (!str) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function EventCard({ event, readonly = false }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const accent = METHOD_ACCENT[event.method.toUpperCase()] ?? 'border-l-gray-500/40';

  return (
    <div className={cn('rounded-lg border border-border bg-card transition-all border-l-2', accent)}>
      {/* Compact header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MethodBadge method={event.method} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs text-muted-foreground"
                title={formatDate(event.created_at)}
              >
                {timeAgo(event.created_at)}
              </span>
              {event.source_ip && (
                <span className="text-xs text-muted-foreground">from {event.source_ip}</span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-foreground/70 truncate">
              {bodyPreview(event)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!readonly && <ReplayDialog event={event} />}
          {!readonly && <VerifyDialog event={event} />}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <>
          <Separator />
          <div className="p-4">
            <Tabs defaultValue="body">
              <TabsList className="h-8 mb-3">
                <TabsTrigger value="body" className="text-xs h-6">Body</TabsTrigger>
                <TabsTrigger value="headers" className="text-xs h-6">
                  Headers ({Object.keys(event.headers).length})
                </TabsTrigger>
                {event.query_params && Object.keys(event.query_params).length > 0 && (
                  <TabsTrigger value="query" className="text-xs h-6">Query</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="body" className="mt-0">
                {event.body ? (
                  <div className="relative">
                    <CopyButton
                      text={event.body}
                      className="absolute right-2 top-2 z-10"
                    />
                    <pre className="overflow-auto rounded-md bg-muted/50 p-4 pr-10 text-xs font-mono text-foreground max-h-96 whitespace-pre-wrap break-all">
                      {prettyJSON(event.body)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">(empty body)</p>
                )}
              </TabsContent>

              <TabsContent value="headers" className="mt-0">
                <div className="overflow-auto rounded-md bg-muted/50 max-h-64">
                  <table className="w-full text-xs font-mono">
                    <tbody>
                      {Object.entries(event.headers).map(([key, value]) => (
                        <tr key={key} className="border-b border-border/50 last:border-0">
                          <td className="py-1.5 px-3 text-muted-foreground align-top whitespace-nowrap w-1/3">
                            {key}
                          </td>
                          <td className="py-1.5 px-3 text-foreground break-all">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {event.query_params && Object.keys(event.query_params).length > 0 && (
                <TabsContent value="query" className="mt-0">
                  <div className="overflow-auto rounded-md bg-muted/50 max-h-48">
                    <table className="w-full text-xs font-mono">
                      <tbody>
                        {Object.entries(event.query_params).map(([key, value]) => (
                          <tr key={key} className="border-b border-border/50 last:border-0">
                            <td className="py-1.5 px-3 text-muted-foreground whitespace-nowrap w-1/3">
                              {key}
                            </td>
                            <td className="py-1.5 px-3 text-foreground break-all">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Event ID: <code className="font-mono">{event.id}</code></span>
              <span>{formatDate(event.created_at)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
