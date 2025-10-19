'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { streamPost } from '@/lib/streamApi';

interface DebateTurn {
  speaker: string;
  message: string;
  position: string;
}

export default function DebatePage() {
  const t = useTranslations('Debate');
  const [topic, setTopic] = useState('');
  const [debateMessages, setDebateMessages] = useState<DebateTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartDebate = async () => {
    if (!topic.trim()) {
      setError(t('error_validation'));
      return;
    }

    setLoading(true);
    setError(null);
    setDebateMessages([]);

    try {
      await streamPost<DebateTurn, { topic: string }>('api/debate/generate', { topic }, (data) => {
        setDebateMessages((prev) => [...prev, data]);
        setTimeout(scrollToBottom, 0);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : t('error_general');
      setError(errorMessage);
      console.error('Debate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleStartDebate();
  };

  const handleNewDebate = () => {
    setTopic('');
    setDebateMessages([]);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-black">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        {/* Input Section */}
        <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 shadow-lg">
          <label htmlFor="topic" className="mb-3 block text-sm font-medium text-black">
            {t('topic_label')}
          </label>
          <div className="flex gap-3">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartDebate()}
              disabled={loading}
              placeholder={t('topic_placeholder')}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
            />
            <button
              onClick={handleStartDebate}
              disabled={loading || !topic.trim()}
              className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('debating')}
                </span>
              ) : (
                t('start_debate')
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg border border-gray-400 bg-gray-100 p-4 text-black">
            <p className="mb-2 font-semibold">❌ {t('error_title')}</p>
            <p className="mb-3 text-sm">{error}</p>
            <button onClick={handleRetry} className="rounded bg-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-400">
              {t('retry')}
            </button>
          </div>
        )}

        {/* Debate Messages Display */}
        <div className="rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-300 p-4">
            <h2 className="font-semibold text-black">
              {debateMessages.length === 0 && !loading ? t('no_debate_yet') : t('debate_header')}
            </h2>
            <div className="flex items-center gap-3">
              {loading && <span className="animate-pulse text-sm text-gray-600">{t('live_streaming')}</span>}
              {debateMessages.length > 0 && !loading && (
                <button
                  onClick={handleNewDebate}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 cursor-pointer"
                >
                  {t('new_debate')}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-120 overflow-y-auto p-4">
            {debateMessages.length === 0 && !loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <p>{t('empty_state')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debateMessages.map((turn, index) => (
                  <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="flex items-end gap-2">
                      {index % 2 === 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-block rounded-full bg-gray-300 px-3 py-1 text-xs font-semibold text-black">
                            {turn.speaker.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-4 max-w-xl ${
                          index % 2 === 0 ? 'border border-gray-300 bg-gray-50' : 'border border-black bg-black text-white'
                        }`}
                      >
                        <p>{turn.message}</p>
                      </div>
                      {index % 2 === 1 && (
                        <div className="flex-shrink-0">
                          <span className="inline-block rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                            {turn.speaker.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
