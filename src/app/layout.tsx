'use client';

import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Remove attributes added by browser extensions that cause hydration mismatch
    if (typeof document !== 'undefined') {
      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
      document.body.removeAttribute('data-gr-ext-installed');
      document.body.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
