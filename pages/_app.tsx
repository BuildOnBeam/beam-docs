import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CookieConsentModal } from '@onbeam/features';

import '../styles.css';
import { GoogleTagManager } from '../lib/GoogleTagManager';

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <CookieConsentModal />
      <GoogleTagManager />
    </>
  );
}
