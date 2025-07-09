// src/middleware.ts o /middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match } from '@formatjs/intl-localematcher';

// --- CONFIGURACIÓN DE IDIOMAS ---
const locales = ['en', 'es']; // Tus idiomas soportados
const defaultLocale = 'es'; // Tu idioma por defecto

// Función para obtener el mejor idioma según las cabeceras del navegador
function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();
  
  try {
    return match(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Revisa si la ruta ya tiene un prefijo de idioma (ej. /en/about)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return; // No hagas nada, la ruta ya es correcta
  }

  // 2. Si no tiene idioma, detecta el mejor y redirige
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  // Ejemplo: Si el usuario va a '/', será redirigido a '/es/' o '/en/'
  return NextResponse.redirect(request.nextUrl);
}

// --- CONFIGURACIÓN DEL MATCHER ---
export const config = {
  matcher: [
    // Omitir todas las rutas internas y de archivos estáticos
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};