'use client';

import { useRouter } from 'next/navigation';
import { WarningCallout } from 'nhsuk-react-components';
import { FormEvent, useState } from 'react';

import { WhiteLabelEntry } from '@/config/whiteLabel';
import { Agreement } from '@/services/getUserAgreements';

import styles from './styles.module.css';

function SelectAgreementPageContent({
  agreements_to_display,
  whiteLabelValues,
}: {
  agreements_to_display: Agreement[];
  whiteLabelValues: WhiteLabelEntry;
}) {
  const router = useRouter();
  const [filteredAgreements, setFilteredAgreements] = useState<Agreement[]>(
    agreements_to_display,
  );
  const [searchInput, setSearchInput] = useState<string>('');
  const [lastSearchInput, setLastSearchInput] = useState<string>('');
  const [showClearSearch, setShowClearSearch] = useState<boolean>(false);
  const [tableCaptionText, setTableCaptionText] = useState<string>(
    getTableCaptionText(agreements_to_display.length, ''),
  );

  function handleSearch(searchEvent: FormEvent<HTMLFormElement>): void {
    searchEvent.preventDefault();
    const form_data = new FormData(searchEvent.target as HTMLFormElement);
    const input = form_data.get('agreement-search-input') as string;
    setSearchInput(input);
    if (!input || input.trim() === '') {
      window.location.reload();
      return;
    }
    const newFilteredAgreements = agreements_to_display.filter(
      (agreement) =>
        (agreement.meaningful_name?.toLowerCase() ?? '').includes(
          input.toLowerCase(),
        ) || agreement.agreement_id.toLowerCase().includes(input.toLowerCase()),
    );

    setFilteredAgreements(newFilteredAgreements);
    setTableCaptionText(
      getTableCaptionText(newFilteredAgreements.length, input),
    );
    setLastSearchInput(input);
    setShowClearSearch(true);
    return;
  }

  function handleClearSearch(): void {
    setSearchInput('');
    setFilteredAgreements(agreements_to_display);
    setTableCaptionText('');
    setShowClearSearch(false);
  }

  function handleAgreementSelect(agreementId: string): void {
    console.log(`Selected agreement: ${agreementId}`);
    router.push(`/agreement/${agreementId}/`);
  }

  function getTableCaptionText(agreementsCount: number, searchInput: string) {
    return `${agreementsCount} agreement${agreementsCount !== 1 ? 's' : ''} found matching '${searchInput}'`;
  }

  return (
    <div className='nhsuk-grid-row'>
      <div className='nhsuk-grid-column-two-thirds'>
        <section data-cy='select-agreement-page'>
          <h1>Access an agreement</h1>
          <form onSubmit={(e) => handleSearch(e)}>
            <div className='nhsuk-form-group  nhsuk-u-margin-bottom-0'>
              <label className='nhsuk-label' htmlFor='agreement-search-input'>
                Search agreements by name or number
              </label>
              <div className='nhsuk-button-group nhsuk-button-group--small'>
                <input
                  className='nhsuk-input nhsuk-input--width-20'
                  id='agreement-search-input'
                  name='agreement-search-input'
                  type='search'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                  className={`nhsuk-button nhsuk-button--secondary nhsuk-u-margin-left-2 ${styles.search_button}`}
                  type='submit'
                  data-module='nhsuk-button'
                >
                  Search
                </button>
              </div>
            </div>
          </form>
          <div>
            <div aria-live='polite'>
              {showClearSearch && filteredAgreements.length > 0 && (
                <p id='search-result-caption' aria-atomic='true'>
                  {tableCaptionText}
                </p>
              )}
            </div>
            {showClearSearch && (
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  handleClearSearch();
                }}
                className='nhsuk-link nhsuk-link--no-visited-state'
              >
                Clear search
              </a>
            )}
          </div>
          <br />
          {filteredAgreements.length > 0 && (
            <table className='nhsuk-table'>
              <caption
                id='agreements-table-caption'
                aria-live='polite'
                className={`nhsuk-table__caption--m ${styles.table_caption} nhsuk-u-visually-hidden`}
              >
                Agreements
              </caption>
              <thead className='nhsuk-table__head'>
                <tr>
                  <th scope='col' className='nhsuk-table__header'>
                    Agreement name
                  </th>
                  <th scope='col' className='nhsuk-table__header'>
                    Agreement number
                  </th>
                </tr>
              </thead>
              <tbody className='nhsuk-table__body'>
                {filteredAgreements.length > 0 ? (
                  [...filteredAgreements]
                    .sort((a, b) => {
                      const nameA = (
                        a.meaningful_name ?? a.agreement_id
                      ).toLowerCase();
                      const nameB = (
                        b.meaningful_name ?? b.agreement_id
                      ).toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map((agreement) => (
                      <tr
                        key={agreement.agreement_id}
                        className='nhsuk-table__row'
                      >
                        <td className='nhsuk-table__cell'>
                          <a
                            id={`agreement_selector-${agreement.agreement_id}`}
                            href='#'
                            onClick={(e) => {
                              e.preventDefault();
                              handleAgreementSelect(agreement.agreement_id);
                            }}
                          >
                            {agreement.meaningful_name
                              ? agreement.meaningful_name
                              : agreement.agreement_id}
                          </a>
                        </td>
                        <td className='nhsuk-table__cell'>
                          {agreement.agreement_id.toLocaleUpperCase()}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr className='nhsuk-table__row'>
                    <td className='nhsuk-table__cell' colSpan={2}>
                      No agreements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {filteredAgreements.length == 0 &&
            agreements_to_display.length != 0 && (
              <>
                <h2>
                  No agreements found matching &apos;{lastSearchInput}&apos;
                </h2>
                <p>Try searching using different criteria</p>
              </>
            )}
          {filteredAgreements.length == 0 &&
            agreements_to_display.length == 0 && (
              <WarningCallout>
                <p style={{ marginTop: '2rem', fontSize: '1.2em' }}>
                  You aren&apos;t a member of any agreements in our database. If
                  this is in error please contact us.
                </p>
              </WarningCallout>
            )}
          <details className='nhsuk-details'>
            <summary className='nhsuk-details__summary'>
              <span
                className='nhsuk-details__summary-text'
                data-cy='status_key'
              >
                More information on this step
              </span>
            </summary>
            <div className='nhsuk-details__text'>
              <p>
                If you are a User Manager select an agreement to manage users
              </p>
              <p>
                If you are a Data Analyst select an agreement to access your
                data via the {whiteLabelValues.acronym} platform.
              </p>
              <p>If you have both roles you will be able to do both.</p>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}

export { SelectAgreementPageContent };
