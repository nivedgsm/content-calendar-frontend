import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GSM Client Management Portal',
  description: 'The GSM client management portal by Global Studio Media.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}