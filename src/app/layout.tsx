import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CustomerProvider } from "@/components/providers/CustomerProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | SEOPilot",
    default: "SEOPilot – SEO & Content Automation",
  },
  description:
    "Vollständige SEO-Plattform: Keyword-Research, Content-Generierung, Rank-Tracking & Wettbewerbsanalyse",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <CustomerProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl p-6 lg:p-8">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </CustomerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
