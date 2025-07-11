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
      label: 'For Travelers',
      items: ['for-travelers/Browse-experiences', 'for-travelers/buying-nfts', 'for-travelers/leaving-a-review'],
    },
    {
      type: 'category',
      label: 'For Providers',
      items: ['for-providers/creating-a-profile', 'for-providers/listing-an-experience', 'for-providers/secondary-market-royalties'],
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