// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match as matchLocale } from '@formatjs/intl-localematcher';

const locales = ['en', 'es'];
const defaultLocale = 'es';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  try {
    return matchLocale(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Revisa si la ruta ya tiene un prefijo de idioma (ej. /en/staking)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return; // No hagas nada, la ruta ya es correcta
  }

  // 2. Si no tiene idioma, detecta el mejor y redirige
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  // Ejemplo: Si el usuario va a '/staking', será redirigido a '/es/staking'
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Omitir todas las rutas internas y de archivos estáticos
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};