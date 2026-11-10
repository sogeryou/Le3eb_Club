import React, { useState } from 'react';

const fallbacks = {
  avatar: '/default-companion.svg',
  cover: '/default-cover.svg',
};

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'onError'> & {
  src?: string | null;
  kind?: keyof typeof fallbacks;
};

export function ResilientImage({ src, kind = 'cover', alt = '', ...props }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const usable = src && !/(?:picsum\.photos|example\.com|images\.unsplash\.com)(?:[/:?#]|$)/i.test(src) &&
    (/^\/(?![\/\\])/.test(src) || /^https:\/\//i.test(src));
  const effective = usable && failed !== src ? src : fallbacks[kind];
  return <img {...props} alt={alt} src={effective} referrerPolicy="no-referrer"
    onError={() => { if (effective !== fallbacks[kind]) setFailed(effective); }} />;
}
