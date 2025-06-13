// app/[locale]/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

// Proveedores
import DappKitProviders from "@/components/DappKitProviders";
import { ThemeProvider } from "@/components/theme-provider";

// Componentes Globales
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/landing/Footer"; // Asumiendo que lo pusimos en `landing`
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TokenTrip - Own Your Experience",
  description: "The future of tokenized real-world assets and experiences.",
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <DappKitProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            <Navbar />
            <main>{children}</main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </DappKitProviders>
      </body>
    </html>
  );
}
