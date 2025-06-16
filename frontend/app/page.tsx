'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">AI Docs Generator</h1>
      <Link href="/login" className="mb-4 text-blue-500 underline">Login</Link>
      <Link href="/generate-docs" className="text-blue-500 underline">Generate Docs</Link>
    </div>
  );
}
