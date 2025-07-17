// docs/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    corePlugins: {
      preflight: false, // Es importante deshabilitar esto para no entrar en conflicto con los estilos de Docusaurus
    },
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./docs/**/*.{md,mdx}"], // Apunta a los archivos de Docusaurus
    theme: {
      extend: {},
    },
    plugins: [],
  };