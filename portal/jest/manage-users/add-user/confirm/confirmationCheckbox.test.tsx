import { render, screen } from '@testing-library/react';

import ConfirmationCheckbox from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmationCheckbox';

describe('confirmationCheckbox tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProps = {
    name: 'confirm',
    label: 'I agree to the terms',
  };

  it('renders correctly without errors', () => {
    const result = ConfirmationCheckbox(baseProps);
    render(result);

    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms/i,
    });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('name', 'confirm');
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox).not.toHaveAttribute('aria-describedby');

    const container = checkbox.closest('.nhsuk-form-group');
    expect(container).toHaveClass('nhsuk-form-group');
    expect(container).not.toHaveClass('nhsuk-form-group--error');
  });

  it('renders error messages when provided', () => {
    const errors = ['You must accept the agreement', 'Another error'];

    render(<ConfirmationCheckbox {...baseProps} errors={errors} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms/i,
    });

    errors.forEach((error) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    const visuallyHidden = screen.getAllByText('Error:');
    expect(visuallyHidden.length).toBe(errors.length);

    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toMatch(/confirm-error-0/);
    expect(describedBy).toMatch(/confirm-error-1/);

    const container = checkbox.closest('.nhsuk-form-group');
    expect(container).toHaveClass('nhsuk-form-group--error');
  });

  it('associates label and input correctly with aria-labelledby', () => {
    render(<ConfirmationCheckbox {...baseProps} />);

    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms/i,
    });
    console.log('Accessible name:', checkbox.getAttribute('aria-labelledby'));

    expect(checkbox).toHaveAttribute('aria-labelledby', 'confirm-label');

    const label = screen.getByText(/i agree to the terms/i);
    expect(label).toHaveAttribute('id', 'confirm-label');
    expect(label).toHaveAttribute('for', 'confirm-input');
  });
});
