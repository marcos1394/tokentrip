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

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/your-username/tokentrip/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/your-username/tokentrip/tree/main/docs/',
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
          href: 'https://github.com/your-username/tokentrip', // TU REPO
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
            { label: 'Getting Started', to: '/docs/intro' },
            { label: 'Tokenomics', to: '/docs/category/tkt-tokenomics' },
            { label: 'Governance', to: '/docs/category/dao--governance' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Discord', href: '#' },
            { label: 'Twitter', href: '#' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'GitHub', href: 'https://github.com/your-username/tokentrip' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TokenTrip. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['move'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;