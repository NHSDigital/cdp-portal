"use client";

import { useSearchParams } from "next/navigation";

/*
 * The hidden inputs mean that when you submit a form, you don't lose the filters that were already there
 * For example hitting search won't remove the filter for status
 */

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
      <input type="hidden" key={i} name={key} value={value} />
    ));
}
