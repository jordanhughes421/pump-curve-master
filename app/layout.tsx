import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/header";
import Footer from "./components/footer";
import { UserProvider } from "./dashboard/user-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pump Curve Manager",
  description: "A professional tool for managing and analyzing pump performance curves. Create, edit, and visualize pump curves with ease.",
  keywords: "pump curve, pump performance, hydraulic analysis, pump efficiency, pump selection",
  authors: [{ name: "Pump Curve Manager Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  openGraph: {
    title: "Pump Curve Manager",
    description: "A professional tool for managing and analyzing pump performance curves",
    type: "website",
    locale: "en_US",
    siteName: "Pump Curve Manager",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-background text-foreground antialiased`}>
        <UserProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
