import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TokenTrip Docs',
  tagline: 'The Official Guide to the Decentralized Experience Economy',
  favicon: 'img/favicon.ico',

  url: 'https://docs.tokentrip.com', // TU URL DE PRODUCCIÓN
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

 

  plugins: [
    async function myPlugin(context, options) {
      return {
        name: "docusaurus-tailwindcss",
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(require("tailwindcss"));
          postcssOptions.plugins.push(require("autoprefixer"));
          return postcssOptions;
        },
      };
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/marcos1394/tokentrip/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/marcos1394/tokentrip/tree/main/docs/',
          // --- AÑADIDO: Se enlaza el archivo de autores ---
          authorsMapPath: 'authors.yml',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/tokentrip-social-card.jpg',
    navbar: {
      title: 'TokenTrip',
      logo: {
        alt: 'TokenTrip Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/marcos1394/tokentrip',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            // --- CORRECCIÓN: Se enlaza al primer documento de cada categoría ---
            { label: 'Tokenomics', to: '/docs/tokenomics/what-is-tkt' },
            { label: 'Governance', to: '/docs/governance/intro-to-dao' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discord', href: '#' }, // Reemplazar con tu enlace real
            { label: 'Twitter', href: '#' }, // Reemplazar con tu enlace real
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'GitHub', href: 'https://github.com/marcos1394/tokentrip' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TokenTrip. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
