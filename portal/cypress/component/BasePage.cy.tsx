import { SessionContext } from "next-auth/react";
import React from "react";
import BasePage from "../../components/BasePage";
import type { Notice } from "../../services/getNotifications";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";

const getBasePageJSX = (notificationItems: Notice[]) => {
  return (
    <RouterContext.Provider
      // @ts-ignore
      value={{}}
    >
      <SessionContext.Provider
        // @ts-ignore
        value={{}}
      >
        {/* @ts-expect-error */}
        <BasePage mainRef={null} notificationItems={notificationItems}>
          <></>
        </BasePage>
      </SessionContext.Provider>
    </RouterContext.Provider>
  );
};

const testNotificationItems = [
  {
    notification: "**Warning**: red",
    colour: "red",
    noticeId: "notice_1685628554",
  },
  {
    notification: "**Warning**: yellow",
    colour: "yellow",
    noticeId: "notice_1685628556",
  },
  {
    notification: "**Notification**: blue",
    colour: "blue",
    noticeId: "notice_1685628558",
  },
];

describe("<BasePage />", () => {
  it("No banners are displayed when no notifications are given", () => {
    cy.mount(getBasePageJSX([]));
    cy.get("span").find("strong").should("have.length", 0);
  });
  it("correctly displays three notification banners", () => {
    cy.mount(getBasePageJSX(testNotificationItems));
    cy.get('[class*="notification notification-red "]').should(
      "include.text",
      ": red"
    );
    cy.get('[class*="notification notification-blue "]').should(
      "include.text",
      ": blue"
    );
    cy.get('[class*="notification notification-yellow "]').should(
      "include.text",
      ": yellow"
    );
    cy.get("span").find("strong").should("have.length", 3);
  });
});
