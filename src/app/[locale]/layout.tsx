// src/app/[locale]/layout.tsx

import { Inter } from "next/font/google";
import "./globals.css";

// Proveedores
import I18nProviderClient from "@/components/i18n-provider-client";
import i18next from "@/i18n";
import { ThemeProvider } from "@/components/theme-provider";
import DappKitProviders from "@/components/DappKitProviders";

// --- NUEVO: Se importan los componentes globales ---
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TokenTrip - Tus Experiencias, Tu Propiedad",
  description: "El futuro de los viajes y el entretenimiento, tokenizado en la blockchain de Sui.",
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (i18next.language !== locale) {
    i18next.changeLanguage(locale);
  }

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
            <I18nProviderClient locale={locale}>
              {/* Navbar ahora vive aquí, aparecerá en todas las páginas */}
              <Navbar />
              
              {/* Usamos <main> para el contenido principal de cada página */}
              <main>
                {children}
              </main>
              
              {/* Footer ahora vive aquí, aparecerá en todas las páginas */}
              <Footer />
              
            </I18nProviderClient>
          </ThemeProvider>
        </DappKitProviders>
      </body>
    </html>
  );
}