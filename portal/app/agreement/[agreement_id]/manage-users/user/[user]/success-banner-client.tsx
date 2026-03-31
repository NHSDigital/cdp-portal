'use client';

import dynamic from 'next/dynamic';

type SuccessBannerProps = {
  message: string;
};

const SuccessBanner = dynamic(() => import('@/app/_components/SuccessBanner'), {
  ssr: false,
});

export default function SuccessBannerClient({ message }: SuccessBannerProps) {
  return <SuccessBanner successMessage={message} />;
}
