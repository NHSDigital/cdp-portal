import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

import { tagInfoMap } from './tagInfoMap';
import { Tags } from './tagInfoMap.config';

interface StatusTagProps {
  status: Tags;
}

export function StatusTag({ status }: StatusTagProps) {
  return tagInfoMap[status].element || null;
}

export function WhatDoTheseStatusesMean({
  whiteLabelKey,
}: {
  whiteLabelKey: WhiteLabelKey;
}) {
  return (
    <details className='nhsuk-details'>
      <summary className='nhsuk-details__summary'>
        <span className='nhsuk-details__summary-text' data-cy='status_key'>
          What do these statuses mean?
        </span>
      </summary>
      <span className='nhsuk-u-visually-hidden'>Expand to see</span>
      <div className='nhsuk-details__text'>
        <table className='nhsuk-table' data-cy='status_key_table'>
          <thead className='nhsuk-table__head'>
            <tr>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody className='nhsuk-table__body'>
            {Object.entries(tagInfoMap).map(
              ([key, { element, description, show }]) => {
                const shouldShow = show ? show({ whiteLabelKey }) : true;

                if (!shouldShow) return null;

                return (
                  <tr key={key} className='nhsuk-table__row'>
                    <td className='nhsuk-table__cell'>{element}</td>
                    <td className='nhsuk-table__cell'>{description}</td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}
