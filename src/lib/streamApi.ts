/**
 * Streaming API utility for handling real-time responses from the backend
 * Parses SSE (Server-Sent Events) where each event is terminated by a blank line
 */

interface StreamError {
  error: string;
  message?: string;
}

/**
 * Stream a POST request and process each SSE event's data as JSON
 * @template T - Type of each streamed data chunk
 * @template B - Type of request body
 * @param endpoint - API endpoint (without /api/backend/ prefix)
 * @param body - Request body
 * @param onData - Callback function called for each parsed JSON event
 * @param headers - Optional custom headers
 * @returns Promise that resolves when stream ends or rejects on error
 */
export async function streamPost<T = unknown, B = unknown>(
  endpoint: string,
  body: B,
  onData: (data: T) => void,
  headers?: Record<string, string>,
): Promise<void> {
  try {
    // Build the full URL with /api/backend/ prefix
    const url = `/api/backend/${endpoint}`;

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...headers,
    };

    // Make the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    // Check for HTTP errors
    if (!response.ok) {
      // Surface a clearer message for oversized requests
      if (response.status === 413) {
        throw new Error('Request too large');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get the response body as a readable stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // For SSE, collect data: lines until a blank line, then dispatch one event
    let eventDataLines: string[] = [];

    try {
      // Read chunks from the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // If the stream ended but we have a pending event, try to dispatch it
          const pending = eventDataLines.join('\n').trim();
          if (pending) {
            try {
              const parsed = JSON.parse(pending) as unknown as T & { done?: boolean };
              if ((parsed as { done?: boolean }).done) {
                break;
              }
              onData(parsed as T);
            } catch (parseError) {
              console.warn('Failed to parse final SSE event:', pending, parseError);
            }
          }
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines (handle both \n and \r\n)
        const lines = buffer.split(/\r?\n/);

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine; // keep as-is for checks

          // Blank line means dispatch the current event
          if (line === '') {
            const dataStr = eventDataLines.join('\n');
            eventDataLines = [];

            if (!dataStr.trim()) {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr) as unknown as T & { done?: boolean };
              if ((parsed as { done?: boolean }).done) {
                // Stop streaming on final marker
                return;
              }
              onData(parsed as T);
            } catch (parseError) {
              console.error('Failed to parse SSE data event:', dataStr, parseError);
              throw new Error(`Failed to parse debate response: ${dataStr}`);
            }

            continue;
          }

          // Comment line, ignore
          if (line.startsWith(':')) {
            continue;
          }

          // data: line (may occur multiple times per event)
          if (line.startsWith('data:')) {
            // Per SSE spec, everything after the first colon is the data (trim only the leading space)
            const dataPart = line.slice(5).trimStart();
            eventDataLines.push(dataPart);
            continue;
          }

          // Other SSE fields (event:, id:, retry:) are ignored for now
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    // Handle all errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Stream API Error:', error);

    throw {
      error: 'Failed to stream data',
      message: errorMessage,
    } as StreamError;
  }
}
