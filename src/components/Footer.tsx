// src/components/landing/Footer.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { Plane } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Footer() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = params.locale;

  return (
    <footer className="py-12 px-4 border-t bg-slate-100/50 dark:bg-slate-800/20">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 text-muted-foreground">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 sui-gradient rounded-lg flex items-center justify-center shadow-lg shadow-sui-blue/30">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold heading-gradient">TokenTrip</span>
            </div>
            <p className="text-sm">{t("footer.description")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.product")}</h4>
            <ul className="space-y-2">
              <li><a href={`/${locale}#explorar`} className="hover:text-foreground transition-colors">Marketplace</a></li>
              <li><Link href={`/${locale}/staking`} className="hover:text-foreground transition-colors">Staking</Link></li>
              <li><a href={`/${locale}#fifa2026`} className="hover:text-foreground transition-colors">{t("navigation.fifa2026")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.resources")}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentación</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Soporte</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.community")}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TokenTrip. {t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}