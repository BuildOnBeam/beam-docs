import { CookieConsent } from '@onbeam/features';
import { cx } from '@onbeam/styled-system/css';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import { GoogleTagManager } from '../components/google-tag-manager';

import '../styles.css';

import localFont from 'next/font/local';
export const beamSansFont = localFont({
  src: [
    {
      path: '../node_modules/@onbeam/business-ui/dist/fonts/BeamSans-Book.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../node_modules/@onbeam/business-ui/dist/fonts/BeamSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'sans-serif',
  ],
  variable: '--beam-business-fonts-main',
});

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <div className={cx(beamSansFont.variable, beamSansFont.className)}>
        <Component {...pageProps} />
      </div>
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
