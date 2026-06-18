import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const METHOD_COLORS: Record<string, string> = {
  GET:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  POST:    'bg-green-500/15 text-green-400 border-green-500/30',
  PUT:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  PATCH:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  DELETE:  'bg-red-500/15 text-red-400 border-red-500/30',
  HEAD:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
  OPTIONS: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLORS[method.toUpperCase()] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  return (
    <Badge variant="outline" className={cn('font-mono text-xs font-semibold px-2 py-0.5 border', color)}>
      {method.toUpperCase()}
    </Badge>
  );
}
