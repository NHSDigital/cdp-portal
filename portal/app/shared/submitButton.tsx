import React from 'react';

// Fallback if useFormStatus isn't available (like in Cypress tests)
let useFormStatusSafe = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'useFormStatus fallback triggered — expected in tests, but not in production.',
    );
  }
  return { pending: false };
};

try {
  // Only load useFormStatus if it's available (RSC env)
  const reactDom = require('react-dom');
  if (typeof reactDom.useFormStatus === 'function') {
    useFormStatusSafe = reactDom.useFormStatus;
  }
} catch {
  // Fallback to the safe version if useFormStatus is not available
  console.warn('useFormStatus not available, using fallback.');
}

export default function SubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disable the submit button when the form is pending
  const { pending } = useFormStatusSafe();

  return (
    <button
      type='submit'
      className='nhsuk-button'
      disabled={pending}
      data-cy='submit-button'
    >
      {children}
    </button>
  );
}
