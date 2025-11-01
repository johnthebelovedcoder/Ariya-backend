import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | Ariya Backend',
  description: 'Interactive API documentation for the Ariya event planning platform',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Ariya API Documentation</h1>
          <p className="mt-2 text-gray-600">Interactive API documentation with Swagger UI</p>
        </div>
      </header>
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}