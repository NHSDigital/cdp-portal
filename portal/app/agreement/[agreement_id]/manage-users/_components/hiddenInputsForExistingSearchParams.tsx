'use client';

import { useSearchParams } from 'next/navigation';

interface HiddenInputsForExistingSearchParamsParams {
  exclude: string;
}

export default function HiddenInputsForExistingSearchParams({
  exclude,
}: HiddenInputsForExistingSearchParamsParams) {
  const searchParams = useSearchParams();

  if (!searchParams) return null;

  return Array.from(searchParams)
    .filter(([key]) => key !== exclude)
    .map(([key, value], i) => (
      <input
        data-cy='hidden-input'
        type='hidden'
        key={i}
        name={key}
        value={value}
      />
    ));
}
