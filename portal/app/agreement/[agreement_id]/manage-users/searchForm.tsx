"use client";

import { useSearchParams } from "next/navigation";
import HiddenInputsForExistingSearchParams from "./hiddenInputsForExistingSearchParams";

export default function SearchForm() {
  const search_params = useSearchParams();
  return (
    <form>
      <HiddenInputsForExistingSearchParams exclude="query" />
      <div className="nhsuk-form-group">
        <label
          className="nhsuk-label"
          id="user-search-hint"
          htmlFor="user-search-input"
        >
          <h3 className="nhsuk-heading-xs nhsuk-u-margin-bottom-2">
            Search by name or email
          </h3>
        </label>
        <input
          className="nhsuk-input nhsuk-input--width-14 nhsuk-u-margin-bottom-4"
          id="user-search-input"
          name="query"
          type="text"
          aria-describedby="user-search-hint"
          defaultValue={search_params?.get("query")?.trim() || undefined}
        />
        <button
          className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-top-0"
          data-module="nhsuk-button"
          type="submit"
        >
          Search
        </button>
      </div>
    </form>
  );
}
