import { SessionContext } from "next-auth/react";
import React from "react";
import type { Notice } from "../../services/getNotifications";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import SwitchAgreementPage from "../../pages/agreement/[agreement_id]/switchagreement";

const getSwitchAgreementPageJSX = (
  notificationItems: Notice[],
  agreementCount: number
) => {
  return (
    <RouterContext.Provider
      // @ts-ignore
      value={{
        query: { agreement_id: "dsa-000-fake" },
        // @ts-ignore
        events: { on: () => {}, off: () => {} },
        // @ts-ignore
        push: () => {},
      }}
    >
      <SessionContext.Provider
        // @ts-ignore
        value={{ data: { user: { email: "fake@fake.fake" } } }}
      >
        <SwitchAgreementPage
          notificationItems={notificationItems}
          agreementCount={agreementCount}
        />
      </SessionContext.Provider>
    </RouterContext.Provider>
  );
};

describe("<SwitchAgreementPage />", () => {
  it("Number of agreeements is 1 means start switching agreement straight away", () => {
    cy.mount(getSwitchAgreementPageJSX([], 1));
    cy.contains("h1", "Loading agreement dsa-000-fake...").should("exist");
  });

  it("Number of agreeements is 3 means asked to confirm changing agreement", () => {
    cy.mount(getSwitchAgreementPageJSX([], 3));
    cy.contains("h1", "Confirm your agreement selection").should("exist");
  });
});
