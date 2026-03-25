'use client';

import { useEffect } from 'react';

import { CookieNames } from '@/config/constants';

import styles from './manage-users.module.css';

export default function SuccessBanner({
  successMessage,
}: {
  successMessage: string;
}) {
  useEffect(() => {
    document.cookie = `${CookieNames.MANAGE_USERS_SUCCESS_MESSAGE}=;max-age=0;path=/`;
  });

  if (
    typeof window !== 'undefined' &&
    !getCookie(CookieNames.MANAGE_USERS_SUCCESS_MESSAGE)
  ) {
    return null;
  }

  return (
    <div className='nhsuk-u-width-full' role='alert'>
      <p className={`${styles.alert_panel_green} nhsuk-u-width-full`}>
        <svg
          className='nhsuk-icon nhsuk-icon__tick'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          aria-hidden='true'
          width='34'
          height='34'
        >
          <path
            strokeWidth='4'
            strokeLinecap='round'
            d='M18.4 7.8l-8.5 8.4L5.6 12'
            stroke='#007f3b'
          ></path>
        </svg>
        <span className='nhsuk-u-visually-hidden'>Success -</span>
        <span data-cy='success-message'>{successMessage}</span>
      </p>
    </div>
  );
}

function getCookie(cname) {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
