import { WhiteLabelKey } from '@/config/whiteLabel';

import CheckboxFilters from './checkboxFilters';
import styles from './manage-users.module.css';
import SearchForm from './searchForm';
import SelectedFilters from './selectedFilters';

interface FiltersPaneProps {
  whiteLabelKey: WhiteLabelKey;
}

export default function FiltersPane({ whiteLabelKey }: FiltersPaneProps) {
  return (
    <div
      className={`nhsuk-grid-column-one-third nhsuk-u-padding-left-0 nhsuk-u-padding-right-0`}
    >
      <search
        className={`nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3 ${styles.filters_pane} nhsuk-u-margin-left-3`}
        aria-labelledby='filters-pane-heading'
      >
        <h2
          id='filters-pane-heading'
          className='nhsuk-u-padding-left-3 nhsuk-u-padding-right-3 nhsuk-u-margin-bottom-3 nhsuk-heading-m'
        >
          Filters
        </h2>

        <SelectedFilters />

        <div className='nhsuk-u-padding-left-3 nhsuk-u-padding-right-3 nhsuk-u-padding-top-2'>
          <SearchForm />
          <CheckboxFilters whiteLabelKey={whiteLabelKey} />
        </div>
      </search>
    </div>
  );
}
