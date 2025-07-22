// docs/sidebars.ts
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/why-decentralized-travel', 'getting-started/connecting-your-wallet'],
    },
    {
      type: 'category',
      label: 'Auctions',
      items: ['auctions/introduction', 'auctions/for-sellers', 'auctions/for-bidders'],
    },

    {
      type: 'category',
      label: 'Community & Social Features',
      items: [
        {
          type: 'category',
          label: 'Token-Gated Channels',
          link: { type: 'doc', id: 'community/token-gating/introduction' },
          items: ['community/token-gating/for-providers', 'community/token-gating/for-collectors'],
        },
      ],
    },

    {
      type: 'category',
      label: 'Advanced Features',
      items: [
        {
          type: 'category',
          label: 'Evolving NFTs',
          link: { type: 'doc', id: 'advanced/evolving-nfts/introduction' },
          items: ['advanced/evolving-nfts/for-creators', 'advanced/evolving-nfts/for-collectors'],
        },
        {
          type: 'category',
          label: 'Rental Marketplace',
          link: { type: 'doc', id: 'advanced/rentals/introduction' },
          items: ['advanced/rentals/for-owners', 'advanced/rentals/for-renters'],
        },
        {
          type: 'category',
          label: 'P2P Lending',
          link: { type: 'doc', id: 'advanced/lending/introduction' },
          items: ['advanced/lending/for-borrowers', 'advanced/lending/for-lenders'],
        },
      ],
    },
    
    {
      type: 'category',
      label: 'For Travelers',
      items: [
        'for-travelers/Browse-experiences', 
        'for-travelers/buying_nfts', // <-- CORREGIDO
        'for-travelers/leaving-a-review'
      ],
    },
    {
      type: 'category',
      label: 'For Providers',
      items: [
        'for-providers/creating-a-profile', 
        'for-providers/listing-a-experience', // <-- CORREGIDO
        'for-providers/secondary-market-royalties'
      ],
    },
    {
      type: 'category',
      label: 'TKT & Tokenomics',
      items: ['tokenomics/what-is-tkt', 'tokenomics/utility-and-benefits', 'tokenomics/distribution-and-supply', 'tokenomics/value-accrual'],
    },
    {
      type: 'category',
      label: 'DAO & Governance',
      items: ['governance/intro-to-dao', 'governance/how-voting-works', 'governance/creating-a-proposal', 'governance/legal-wrapper'],
    },
    {
      type: 'category',
      label: 'For Developers',
      items: ['for-developers/introduction', 'for-developers/smart-contracts-overview'],
    },
  ],
};

export default sidebars;
