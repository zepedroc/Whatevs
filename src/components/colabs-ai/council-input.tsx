'use client';

import { useTranslations } from 'next-intl';
import type { CouncilMode } from '@/types/colabs-ai';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CouncilInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  rounds: number;
  onRoundsChange: (value: number) => void;
  mode: CouncilMode;
  onModeChange: (value: CouncilMode) => void;
  loading: boolean;
  hasResponses: boolean;
  onAskCouncil: () => void;
  onNewQuery: () => void;
}

export function CouncilInput({
  query,
  onQueryChange,
  rounds,
  onRoundsChange,
  mode,
  onModeChange,
  loading,
  hasResponses,
  onAskCouncil,
  onNewQuery,
}: CouncilInputProps) {
  const t = useTranslations('ColabsAI');
  const isBenchmarkMode = mode === 'benchmark';

  return (
    <div className="sticky bottom-0 shrink-0 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3">
          {isBenchmarkMode ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="text-sm font-medium text-indigo-900">Benchmark mode</p>
              <p className="mt-1 text-xs text-indigo-800">
                Questions are loaded from the default benchmark file configured in the backend.
              </p>
              <p className="mt-2 text-xs text-indigo-800">
                Uses <code className="rounded bg-indigo-100 px-1 py-0.5">question</code>,{' '}
                <code className="rounded bg-indigo-100 px-1 py-0.5">options</code>, and{' '}
                <code className="rounded bg-indigo-100 px-1 py-0.5">expected_option</code> per case.
              </p>
            </div>
          ) : (
            <Textarea
              id="query"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && query.trim()) onAskCouncil();
                }
              }}
              disabled={loading}
              placeholder={t('query_placeholder')}
              rows={3}
              className="min-h-[80px] resize-none"
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!isBenchmarkMode && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="rounds" className="text-muted-foreground">
                    {t('rounds_label')}
                  </Label>
                  <Select
                    value={String(rounds)}
                    onValueChange={(v) => onRoundsChange(Number(v))}
                    disabled={loading}
                  >
                    <SelectTrigger id="rounds" className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="mode" className="text-muted-foreground">
                  {t('mode_label')}
                </Label>
                <Select
                  value={mode}
                  onValueChange={(v) => onModeChange(v as CouncilMode)}
                  disabled={loading}
                >
                  <SelectTrigger id="mode" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parallel">{t('mode_parallel')}</SelectItem>
                    <SelectItem value="conversation">{t('mode_conversation')}</SelectItem>
                    <SelectItem value="benchmark">Benchmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loading && (
                <span className="animate-pulse text-sm text-muted-foreground">
                  {isBenchmarkMode ? 'Benchmark streaming...' : t('live_streaming')}
                </span>
              )}
              {isBenchmarkMode && !loading && (
                <span className="text-xs text-muted-foreground">
                  Benchmark runs 3 parallel rounds internally.
                </span>
              )}
              {hasResponses && !loading && (
                <Button variant="outline" size="sm" onClick={onNewQuery}>
                  {t('new_query')}
                </Button>
              )}
            </div>
            <Button
              onClick={onAskCouncil}
              disabled={isBenchmarkMode ? loading : loading || !query.trim()}
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {isBenchmarkMode ? 'Running benchmark...' : t('querying')}
                </span>
              ) : (
                (isBenchmarkMode ? 'Run Benchmark' : t('ask_council'))
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
