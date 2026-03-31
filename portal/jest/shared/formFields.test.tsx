import { fireEvent, render, screen } from '@testing-library/react';

import {
  CheckboxInputField,
  RadioButtonInputField,
} from '@/app/shared/formFields';

describe('RadioButtonInputField', () => {
  it('renders label, description, and input with correct IDs', () => {
    render(
      <RadioButtonInputField
        label='Option A'
        button_group='group1'
        button_value='value one'
        description='additional info'
      />,
    );

    const input = screen.getByRole('radio');
    const label = screen.getByText('Option A');
    const description = screen.getByText('additional info');

    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    expect(input).toHaveAttribute('id', 'group1-value-one-input');
    expect(label).toHaveAttribute('id', 'group1-value-one-label');
    expect(description).toHaveAttribute('id', 'group1-value-one-description');
  });

  it('sets aria-describedby correctly when only description exists', () => {
    render(
      <RadioButtonInputField
        label='Option A'
        button_group='group1'
        button_value='value one'
        description='info'
      />,
    );

    const input = screen.getByRole('radio');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'group1-value-one-description',
    );
  });

  it('sets aria-describedby correctly when only error_ids exist', () => {
    render(
      <RadioButtonInputField
        label='Option A'
        button_group='group1'
        button_value='value one'
        error_ids={['err1', 'err2']}
      />,
    );

    const input = screen.getByRole('radio');
    expect(input).toHaveAttribute('aria-describedby', 'err1 err2');
  });

  it('sets aria-describedby correctly when both description and error_ids exist', () => {
    render(
      <RadioButtonInputField
        label='Option A'
        button_group='group1'
        button_value='value one'
        description='info'
        error_ids={['err1', 'err2']}
      />,
    );

    const input = screen.getByRole('radio');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'group1-value-one-description err1 err2',
    );
  });

  it('respects default_checked', () => {
    render(
      <RadioButtonInputField
        label='Option A'
        button_group='group1'
        button_value='value'
        default_checked={true}
      />,
    );

    const input = screen.getByRole('radio');
    expect(input).toBeChecked();
  });
});

describe('CheckboxInputField', () => {
  it('renders a checkbox with correct IDs', () => {
    render(
      <CheckboxInputField
        label='Check me'
        button_group='group1'
        button_value='value one'
      />,
    );

    const input = screen.getByRole('checkbox');
    const label = screen.getByText('Check me');

    expect(input).toHaveAttribute('id', 'group1-value-one-input');
    expect(label).toHaveAttribute('id', 'group1-value-one-label');
  });

  it('sets aria-describedby when error_ids exist', () => {
    render(
      <CheckboxInputField
        label='Option'
        button_group='group1'
        button_value='value'
        error_ids={['err1', 'err2']}
      />,
    );

    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('aria-describedby', 'err1 err2');
  });

  it('omits aria-describedby when no error_ids exist', () => {
    render(
      <CheckboxInputField
        label='Option'
        button_group='group1'
        button_value='value'
      />,
    );

    const input = screen.getByRole('checkbox');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('calls onChange when toggled', () => {
    const onChange = jest.fn();

    render(
      <CheckboxInputField
        label='Option'
        button_group='group1'
        button_value='value'
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('checkbox');

    fireEvent.click(input);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('respects default_checked', () => {
    render(
      <CheckboxInputField
        label='Option'
        button_group='group1'
        button_value='value'
        default_checked={true}
      />,
    );

    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
  });
});
