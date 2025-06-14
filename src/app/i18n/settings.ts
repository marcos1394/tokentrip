export const fallbackLng = 'es'
export const locales = [fallbackLng, 'en']
export const defaultNS = 'common'

export function getOptions (lng = fallbackLng, ns = defaultNS) {
  return {
    debug: true, // Descomenta esto para ver logs de i18next en la consola
    supportedLngs: locales,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  }
}