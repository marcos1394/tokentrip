import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
  link: string;
};

// Define el contenido de las tarjetas de características
const FeatureList: FeatureItem[] = [
  {
    title: 'Getting Started',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    link: '/docs/intro',
    description: (
      <>
        Learn the vision behind TokenTrip and follow our simple guides to connect
        your wallet and start exploring the decentralized experience economy.
      </>
    ),
  },
  {
    title: 'Tokenomics & DAO',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    link: '/docs/tokenomics/what-is-tkt',
    description: (
      <>
        Discover the TKT token, our economic flywheel model, and how you can 
        participate in the governance that shapes the future of the platform.
      </>
    ),
  },
  {
    title: 'For Developers',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    link: '/docs/for-developers/introduction',
    description: (
      <>
        Explore our smart contract architecture, learn how to build on the TokenTrip
        protocol, and integrate your own dApps with our ecosystem.
      </>
    ),
  },
];

function Feature({title, Svg, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureLink}>
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="text--center padding-horiz--md">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
