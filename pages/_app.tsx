import { Analytics } from '@vercel/analytics/react';
import { CookieConsentModal } from '@onbeam/features';

import '../styles.css';

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <CookieConsentModal />
    </>
  );
}
