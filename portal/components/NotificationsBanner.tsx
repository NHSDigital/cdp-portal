import React from "react";
import Markdown from "markdown-to-jsx";

interface Props {
  notification: string;
  colour: string;
}

export default function NotificationBanner({ notification, colour }: Props) {
  return (
    <div
      className={`notification notification-${colour} }`}
      role="notification"
    >
      <Markdown>{notification}</Markdown>
    </div>
  );
}
