// src/i18n.ts (Corregido para tu estructura de archivos)
import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18next
  .use(resourcesToBackend((language: string, namespace: string) => {
    // Ahora cargamos directamente el archivo de idioma, ej: ./locales/es.json
    // El 'namespace' que i18next intente cargar (ej. 'common')
    // provendrá de este único archivo por idioma.
    return import(`./locales/${language}.json`);
  }))
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    // 'ns' y 'defaultNS' le dicen a i18next cómo se llaman tus "grupos" de traducciones.
    // Si todo está en un solo archivo (ej. es.json), 'common' es un buen nombre para ese grupo.
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
    // Descomenta la siguiente línea para obtener logs detallados de i18next en la consola del navegador,
    // puede ser muy útil para depurar problemas de carga o namespaces.
    // debug: process.env.NODE_ENV === 'development',
  });

export default i18next;