import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Nius - Opinion & Analysis",
    template: "%s | Nius",
  },
  description: "Your trusted source for political news, election coverage, and in-depth analysis. Stay informed with expert opinions and breaking news.",
  keywords: ["politics", "news", "elections", "analysis", "opinion", "democracy"],
  authors: [{ name: "Nius" }],
  creator: "Nius",
  publisher: "Nius",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Nius',
    title: 'Nius - Opinion & Analysis',
    description: 'Your trusted source for political news, election coverage, and in-depth analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nius - Opinion & Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nius - Opinion & Analysis',
    description: 'Your trusted source for political news, election coverage, and in-depth analysis.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}