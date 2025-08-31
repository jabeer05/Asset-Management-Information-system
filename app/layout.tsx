import type { Metadata } from "next";
import "./globals.css";
import * as React from "react";
import MuiThemeProvider from "../components/MuiThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import ErrorBoundary from "../components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Gusau LGA - Asset Management System",
  description: "Comprehensive asset management system for Gusau Local Government Area - tracking, maintaining, and managing fixed assets with modern design and powerful features",
  keywords: "asset management, fixed assets, inventory, maintenance, tracking, Gusau LGA, local government",
  authors: [{ name: "Gusau LGA IT Team" }],
  manifest: "/manifest.json",

  openGraph: {
    title: "Gusau LGA - Asset Management System",
    description: "Comprehensive asset management system for Gusau Local Government Area - tracking, maintaining, and managing fixed assets",
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    siteName: "Gusau LGA Asset Management System",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gusau LGA - Asset Management System",
    description: "Comprehensive asset management system for Gusau Local Government Area - tracking, maintaining, and managing fixed assets",
  },
};

export const viewport = {
  themeColor: "#1976d2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <MuiThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </MuiThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
