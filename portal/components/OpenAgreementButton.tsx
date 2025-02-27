import Link from "next/link";
import { Button } from "nhsuk-react-components";
import React from "react";

interface Props {
  agreement_id: string;
  meaningful_name?: string;
}

export default function OpenAgreementButton({
  agreement_id,
  meaningful_name,
}: Props) {
  return (
    <Button
      // @ts-ignore
      as={Link}
      href={`/agreement/${agreement_id}`}
      className="agreementButton"
    >
      Open{" "}
      {meaningful_name
        ? `${meaningful_name} (${agreement_id})`
        : `${agreement_id}`}
    </Button>
  );
}
