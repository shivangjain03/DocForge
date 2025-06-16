import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata = {
  title: 'AI Docs Generator',
};

import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
