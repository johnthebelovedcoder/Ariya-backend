'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logError(error, 'Global Error Boundary');
  }, [error]);

  return (
    <html>
      <body>
        <div className="error-container">
          <h2>Something went wrong!</h2>
          <p>We're sorry, but an unexpected error has occurred.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {error.message}
            </details>
          )}
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}