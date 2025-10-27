import { Button } from 'nhsuk-react-components';
import React from 'react';

interface SwitchAgreementButtonProps {
  agreement_id: string;
  switchAgreementCb: (open_using?: string) => Promise<void>;
  open_using: string;
  children?: React.ReactNode;
}

const SwitchAgreementButton = ({
  agreement_id,
  switchAgreementCb,
  open_using = 'browser',
  children,
}: SwitchAgreementButtonProps) => {
  const formCallback = (e: React.SyntheticEvent) => {
    e.preventDefault();
    switchAgreementCb(open_using);
  };
  return (
    <form action={`/api/switchagreement`} method='post' onSubmit={formCallback}>
      <input
        type='hidden'
        name='agreement_id'
        value={agreement_id}
        readOnly={true}
      />
      <input type='hidden' name='uses_js' value='false' readOnly={true} />
      {/* @ts-ignore */}
      <Button as='input' type='submit' style={{ marginBottom: 0 }}>
        {children}
      </Button>
    </form>
  );
};

export default SwitchAgreementButton;
