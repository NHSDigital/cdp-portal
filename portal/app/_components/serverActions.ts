'use server';

import { redirect } from 'next/navigation';

async function handleSelectAgreementForm(
  _initial_state: Record<string, unknown>,
  form_data: FormData,
) {
  const selected_agreement = form_data.get('agreement_selector');
  if (!selected_agreement) {
    return {
      error: 'Select an agreement',
    };
  }
  // redirect function throws redirect error to switch page.
  // do not wrap in try catch block as that will prevent the redirect
  redirect(`/agreement/${selected_agreement}`);
}

export { handleSelectAgreementForm };
