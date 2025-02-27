import { Button } from "nhsuk-react-components";
import React from "react";

interface Props {
  agreement_id: string;
  switchAgreementCb: () => void;
  children?: React.ReactNode;
}

const SwitchAgreementButton = ({
  agreement_id,
  switchAgreementCb,
  children,
}: Props) => {
  const formCallback = (e: React.SyntheticEvent) => {
    e.preventDefault();
    switchAgreementCb();
  };

  return (
    <form action="/api/switchagreement" method="post" onSubmit={formCallback}>
      <input type="hidden" name="agreement_id" value={agreement_id} />
      <input type="hidden" name="uses_js" value="false" />
      {/* @ts-ignore */}
      <Button as="input" type="submit" style={{ marginBottom: 0 }}>
        {children}
      </Button>
    </form>
  );
};

export default SwitchAgreementButton;
