import { useCallback, useState } from "react";

/**
 * Throws an Error within a components rendering cycle.
 * This will allow previously uncaught errors in asynchronous code to be caught by react error boundaries.
 * React error boundaries will then redirect the user to the error page.
 */
export const useAsyncError = () => {
  const [_, setError] = useState();
  return useCallback(
    (e: unknown) => {
      setError(() => {
        throw e;
      });
    },
    [setError]
  );
};
