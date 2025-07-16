import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NotificationEmailProps {
  title: string;
  mainText: string;
  ctaText: string;
  ctaUrl: string;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export const NotificationEmail = ({
  title,
  mainText,
  ctaText,
  ctaUrl,
}: NotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`} // Asegúrate de tener un logo en tu carpeta /public
          width="48"
          height="48"
          alt="TokenTrip"
        />
        <Text style={h1}>{title}</Text>
        <Text style={text}>
          {mainText}
        </Text>
        <Section style={{ textAlign: 'center' }}>
          <Button pX={20} pY={12} style={button} href={ctaUrl}>
            {ctaText}
          </Button>
        </Section>
        <Text style={text}>
          Best,<br/>
          The TokenTrip Team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          TokenTrip - The Decentralized Experience Economy
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NotificationEmail;

// --- Estilos para el Email ---
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const h1 = {
  color: '#1d1c1d',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const text = {
  color: '#5e5e5e',
  fontSize: '16px',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
