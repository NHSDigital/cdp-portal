export default async function IsSDEAgreement(agreement_id: string) {
  if (
    agreement_id.startsWith('dsa-') ||
    agreement_id === 'demo' ||
    agreement_id === 'platform' ||
    agreement_id === 'admin'
  ) {
    return true;
  }
  return false;
}
