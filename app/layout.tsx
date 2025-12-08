"use client"
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { MockServiceProvider } from "@/components/mock-service-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans text-[16px] antialiased`}>
        <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MockServiceProvider />
          {children}
        </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
