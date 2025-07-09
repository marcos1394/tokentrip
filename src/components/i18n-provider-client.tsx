// src/components/i18n-provider-client.tsx (Modificado)
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from '@/i18n'; // Importa la instancia central de i18next

export default function I18nProviderClient({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [isClientI18nextReady, setIsClientI18nextReady] = useState(false);
  const effectRan = useRef(false); // Para asegurar que el efecto de inicialización corra solo una vez

  useEffect(() => {
    // En desarrollo con StrictMode, este efecto podría ejecutarse dos veces.
    // effectRan.current ayuda a que la configuración principal se ejecute solo en la "primera" ejecución del efecto.
    if (effectRan.current && process.env.NODE_ENV === 'development') {
      return;
    }

    // Ya NO necesitamos la siguiente línea ni la condición 'if (needsReactIntegration)':
    // const needsReactIntegration = !i18n.services.reportNamespaces;

    // Simplemente llama a .use() directamente.
    // i18next es generalmente inteligente para no aplicar el mismo plugin dos veces.
    i18n.use(initReactI18next); // Aplica la integración con React

    // Re-inicializa i18next con las opciones de React y el idioma actual.
    i18n.init(
      {
        ...i18n.options,       // Conserva las opciones de src/i18n.ts
        lng: locale,           // Establece el idioma actual
        react: {               // Añade las opciones específicas de React aquí
          useSuspense: false,
        },
      },
      (err) => {
        if (err) {
          console.error('Error al inicializar i18next en I18nProviderClient:', err);
          return;
        }
        setIsClientI18nextReady(true);
      }
    );

    // Marca que el efecto principal de configuración se ha ejecutado
    if (process.env.NODE_ENV === 'development') {
        effectRan.current = true;
    } else {
        // En producción, también marcamos como ejecutado, aunque solo corre una vez.
        effectRan.current = true;
    }

  }, []); // El array vacío [] asegura que este efecto se ejecute una vez al montar (o dos veces en StrictMode en desarrollo)

  // Efecto para cambiar el idioma si la prop 'locale' cambia
  useEffect(() => {
    if (isClientI18nextReady && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, isClientI18nextReady]);

  if (!isClientI18nextReady) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}