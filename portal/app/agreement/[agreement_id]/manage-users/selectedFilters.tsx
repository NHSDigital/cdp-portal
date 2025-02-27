"use client";

import { Filter, FilterOptionProps } from "./checkboxFilters";
import { CHECKBOX_FILTERS } from "./consts";
import styles from "./manage-users.module.css";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";

export default function SelectedFilters() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  if (!searchParams) return null;

  const query = searchParams.get("query") || "";
  const filter_params = CHECKBOX_FILTERS.map((filter) => {
    const search_params_for_filter = searchParams.getAll(filter.id);
    return {
      ...filter,
      options: filter.options.filter((opt) =>
        search_params_for_filter.includes(opt.id)
      ),
    };
  });

  if (!query && !filter_params.some((filter) => filter.options.length > 0))
    return null;

  return (
    <div
      className={`nhsuk-u-padding-left-3 nhsuk-u-padding-right-3 nhsuk-u-padding-top-4 nhsuk-u-padding-bottom-4 nhsuk-u-margin-bottom-2 ${styles.selected_filters}`}
    >
      <div className={styles.selected_filters_heading}>
        <h3 className="nhsuk-u-margin-bottom-3 nhsuk-heading-s">
          Selected filters
        </h3>
        <a href={pathname}>Clear</a>
      </div>

      {query.trim() && (
        <SelectedFilterGroup
          id="query"
          name="Text search"
          options={[{ name: query.trim(), id: query }]}
        />
      )}

      {filter_params
        .filter((filter) => filter.options.length > 0)
        .map((filter) => (
          <SelectedFilterGroup key={filter.id} {...filter} />
        ))}
    </div>
  );
}

function SelectedFilterGroup({ name, id, options }: Filter) {
  return (
    <div className="nhsuk-u-margin-bottom-3">
      <h4 className="nhsuk-u-margin-bottom-0 nhsuk-heading-xs">{name}</h4>
      {options.map((aq) => (
        <SelectedFilterBox key={aq.id} filter_group_id={id} {...aq} />
      ))}
    </div>
  );
}

function SelectedFilterBox({ filter_group_id, id, name }: FilterOptionProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams() as ReadonlyURLSearchParams;

  return (
    <a
      className={styles.active_filter_pill}
      href={`${pathname}${getSearchParamsExcludingKey(
        searchParams,
        filter_group_id,
        id
      )}`}
      aria-label={`Remove ${name}`}
    >
      {name}
      <svg
        className={`nhsuk-icon nhsuk-icon__close ${styles.remove_icon}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        height="20"
        width="20"
      >
        <path d="M13.41 12l5.3-5.29a1 1 0 1 0-1.42-1.42L12 10.59l-5.29-5.3a1 1 0 0 0-1.42 1.42l5.3 5.29-5.3 5.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l5.29-5.3 5.29 5.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z"></path>
      </svg>
    </a>
  );
}

function getSearchParamsExcludingKey(
  params: ReadonlyURLSearchParams,
  key_to_remove: string,
  value_to_remove: string
) {
  const params_copy = new URLSearchParams(params.toString());
  params_copy.delete(key_to_remove, value_to_remove);
  const new_params_string = params_copy.toString();

  if (new_params_string) return "?" + new_params_string;

  return "";
}
