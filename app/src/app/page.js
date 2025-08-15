import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold mb-4">Engineering Project Management</h1>
        <p className="text-gray-600 mb-8">
          Manage your engineering projects securely across multiple organisations.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}