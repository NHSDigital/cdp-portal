import Markdown from 'markdown-to-jsx';
import React from 'react';

interface Props {
  notification: string;
  colour: string;
}

export default function NotificationBanner({ notification, colour }: Props) {
  return (
    <div
      className={`notification notification-${colour} }`}
      role='notification'
    >
      <Markdown>{notification}</Markdown>
    </div>
  );
}
