'use client';

import { useState } from 'react';

import { api } from '@/lib/api';

interface TestResponse {
  message?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export default function TestBackendPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Test the root endpoint
      const result = await api.get<TestResponse>('');

      if (result.isError) {
        setError(result.error?.message || 'Failed to connect to backend');
      } else {
        setResponse(result.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Backend Connection Test</h1>
            <p className="text-slate-400">Test your FastAPI backend connection through the Next.js proxy</p>
          </div>

          {/* Test Button */}
          <button
            onClick={testConnection}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Testing Connection...
              </span>
            ) : (
              'Test Backend Connection'
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold mb-1">❌ Connection Failed</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-red-300">
                Make sure your FastAPI backend is running at{' '}
                <code className="bg-red-800 px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}
                </code>
              </p>
            </div>
          )}

          {/* Success Response */}
          {response && !error && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold mb-3">✅ Connection Successful</p>
              <div className="bg-green-950 rounded p-3">
                <pre className="text-sm overflow-auto">{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold">ℹ️ How it works:</span>
            </p>
            <ol className="text-slate-400 text-sm mt-2 space-y-1 ml-4">
              <li>
                1. This page makes a request to <code className="bg-slate-600 px-1 rounded">/api/backend/</code>
              </li>
              <li>2. The Next.js proxy forwards it to your FastAPI backend</li>
              <li>3. The response is displayed above</li>
            </ol>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Backend URL: {process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}</p>
          <p className="mt-2 text-slate-500">For debugging, check the browser console and Next.js terminal logs</p>
        </div>
      </div>
    </div>
  );
}
