import { Inter } from "next/font/google";
import "../globals.css";

// Proveedores
import I18nProviderClient from "@/components/i18n-provider-client";
import i18next from "@/i18n";
import { ThemeProvider } from "@/components/theme-provider";
import DappKitProviders from "@/components/DappKitProviders";
import { Toaster } from "@/components/ui/toaster"; // Se importa el Toaster

// Componentes Globales
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TokenTrip - Tus Experiencias, Tu Propiedad",
  description: "El futuro de los viajes y el entretenimiento, tokenizado en la blockchain de Sui.",
};

// --- CORRECCIÓN PARA NEXT.JS 15 ---
export default async function RootLayout({
  children,
  params, // 1. Recibe 'params' como un objeto completo
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params; // 2. Extrae 'locale' aquí adentro

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
              <Navbar />
              <main>
                {children}
              </main>
              <Footer />
              <Toaster /> {/* Se añade el Toaster para las notificaciones */}
            </I18nProviderClient>
          </ThemeProvider>
        </DappKitProviders>
      </body>
    </html>
  );
}