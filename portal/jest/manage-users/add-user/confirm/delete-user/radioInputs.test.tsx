import { render, screen } from '@testing-library/react';
import React from 'react';

import RadioInputs from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/_components/radioInputs';

jest.mock('app/shared/formFields', () => ({
  RadioButtonInputField: ({ label }: { label: string }) => <div>{label}</div>,
}));

describe('RadioInputs tests', () => {
  it('renders without errors', () => {
    render(<RadioInputs errors='' />);

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();

    const formGroup = screen.getByText('Yes').closest('div')?.parentElement;
    expect(formGroup).toHaveClass('nhsuk-form-group');
    expect(formGroup).not.toHaveClass('nhsuk-form-group--error');
  });

  it('renders with error message', () => {
    const errorMessage = 'This field is required';

    render(<RadioInputs errors={errorMessage} />);

    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    const formGroup = screen.getByText('Yes').closest('div')?.parentElement;
    expect(formGroup).toHaveClass('nhsuk-form-group--error');
  });
});
