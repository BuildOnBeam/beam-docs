import { css, cx } from '@onbeam/styled-system/css';
import { flex } from '@onbeam/styled-system/patterns';
import Image from 'next/image';
import NextLink from 'next/link';

export const ImageCard = ({
  title,
  href,
  img,
}: { title: string; href: string; img: string }) => (
  <NextLink
    href={href}
    className={cx(
      'group',
      flex({
        direction: 'column',
        rounded: 'md',
        bg: 'mono.750',
        color: 'mono.0',
        border: '1px solid',
        borderColor: 'mono.0/25',
        shadow: 'md',
      }),
    )}
  >
    <div
      className={css({
        overflow: 'hidden',
        aspectRatio: '396 / 378',
        w: 'full',
        h: 'auto',
        roundedTop: '[inherit]',
      })}
    >
      <Image
        src={img}
        alt=""
        width={396}
        height={378}
        className={css({
          w: 'full',
          objectFit: 'cover',
          transitionProperty: 'transform',
          transitionDuration: 'normal',
          transitionTimingFunction: 'ease-out',
          _groupHover: {
            transform: 'scale(1.1)',
          },
          _groupFocus: {
            transform: 'scale(1.1)',
          },
        })}
      />
    </div>
    <div
      className={flex({
        p: '6',
        textAlign: 'center',
        justify: 'center',
      })}
    >
      {title}
    </div>
  </NextLink>
);
