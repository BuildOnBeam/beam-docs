import { CookieConsent } from '@onbeam/features';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import { GoogleTagManager } from '../components/google-tag-manager';
import '../styles.css';

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <CookieConsent
        consentDomain={
          process.env.NODE_ENV === 'development' ? 'localhost' : '.onbeam.com'
        }
      />
      <GoogleTagManager />
    </>
  );
}
