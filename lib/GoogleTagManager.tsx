import Script from 'next/script';
import { getGtmScript } from '@onbeam/utils';
import React from 'react';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export const GoogleTagManager = () => {
  if (!GTM_ID) return null;

  return (
    <Script
      id="gtag"
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required
      dangerouslySetInnerHTML={{
        __html: getGtmScript(GTM_ID),
      }}
    />
  );
};
