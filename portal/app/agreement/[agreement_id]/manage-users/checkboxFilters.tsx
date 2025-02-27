"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HiddenInputsForExistingSearchParams from "./hiddenInputsForExistingSearchParams";
import useHasJavascript from "app/shared/useHasJavascript";
import { CHECKBOX_FILTERS } from "./consts";
import styles from "./manage-users.module.css";
import { CheckboxInputFieldProps } from "app/shared/formFields";

export interface FilterOption {
  name: string;
  id: string;
}

export interface Filter {
  id: string;
  name: string;
  options: FilterOption[];
}

export default function CheckboxFilters() {
  return CHECKBOX_FILTERS.map(({ id, name, options }) => (
    <FilterGroup key={id} id={id} name={name} options={options} />
  ));
}

export function CheckboxSmallInputField({
  label,
  button_group,
  button_value,
  default_checked,
  onChange,
}: CheckboxInputFieldProps) {
  const checkbox_input_id = `${button_group}-${button_value.replaceAll(
    " ",
    "-"
  )}`;
  return (
    <div className={styles.checkboxes_small__item}>
      <input
        className={styles.checkboxes_small__input}
        id={checkbox_input_id + "-input"}
        name={button_group}
        type="checkbox"
        value={button_value}
        defaultChecked={default_checked}
        onChange={onChange}
      />
      <label
        className={styles.checkboxes_small__label + " nhsuk-label"}
        htmlFor={checkbox_input_id + "-input"}
      >
        {label}
      </label>
    </div>
  );
}

function FilterGroup({ id, name, options }: Filter) {
  const hasJs = useHasJavascript();

  return (
    <form>
      <HiddenInputsForExistingSearchParams exclude={id} />
      <div className="nhsuk-form-group">
        <fieldset className="nhsuk-fieldset">
          <legend className="nhsuk-fieldset_legend">
            <h3 className="nhsuk-heading-xs nhsuk-u-margin-bottom-2">{name}</h3>
          </legend>
          <div className={styles.checkboxes_small__small}>
            {options.map((option) => (
              <FilterOption filter_group_id={id} key={option.id} {...option} />
            ))}
          </div>
        </fieldset>
        {hasJs || (
          <button
            className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-top-3"
            data-module="nhsuk-button"
            type="submit"
          >
            Filter by {name.toLowerCase()}
          </button>
        )}
      </div>
    </form>
  );
}

export interface FilterOptionProps extends FilterOption {
  filter_group_id: string;
}

function FilterOption({ name, id, filter_group_id }: FilterOptionProps) {
  const search_params = useSearchParams();
  const default_checked = search_params
    ?.getAll(filter_group_id)
    ?.some((param) => param == id);
  const { replace } = useRouter();
  const pathname = usePathname();

  function handleChange(checked: boolean) {
    const new_params = new URLSearchParams(search_params || "");
    if (checked) {
      new_params.append(filter_group_id, id);
    } else {
      new_params.delete(filter_group_id, id);
    }
    replace(`${pathname}?${new_params.toString()}`, { scroll: false });
  }

  return (
    <CheckboxSmallInputField
      label={name}
      button_group={filter_group_id}
      button_value={id}
      default_checked={default_checked}
      onChange={(e) => handleChange(e.target.checked)}
    />
  );
}
