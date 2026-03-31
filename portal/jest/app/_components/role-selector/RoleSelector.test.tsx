import { render, screen } from '@testing-library/react';

import { RadioButtonInputField } from '@/app/shared/formFields';

jest.mock('app/shared/formFields', () => ({
  RadioButtonInputField: jest.fn(({ label, description }) => (
    <div data-testid='radio'>
      <span>{label}</span>
      <span>{description}</span>
    </div>
  )),
}));

jest.mock('@/app/_components/role-selector/roleInfoMap', () => {
  const actual = jest.requireActual(
    '@/app/_components/role-selector/roleInfoMap',
  );

  return {
    ...actual,
  };
});

import RoleSelector from '@/app/_components/role-selector/RoleSelector';

const loadRoleSelectorWithMaps = (
  overrides: Partial<{
    analystDescriptionMap: Record<string, string>;
    userManagerDescriptionMap: Record<string, string>;
    bothDescriptionMap: Record<string, string>;
  }>,
) => {
  jest.resetModules();

  jest.doMock('@/app/_components/role-selector/roleInfoMap', () => {
    const actual = jest.requireActual(
      '@/app/_components/role-selector/roleInfoMap',
    );

    return {
      ...actual,
      ...overrides,
    };
  });

  let ReloadedRoleSelector;

  jest.isolateModules(() => {
    ReloadedRoleSelector =
      require('@/app/_components/role-selector/RoleSelector').default;
  });

  return ReloadedRoleSelector;
};

describe('RoleSelector', () => {
  const whiteLabelKey = 'SDE';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a radio button for each role', () => {
    render(<RoleSelector whiteLabelKey={whiteLabelKey} />);

    const radios = screen.getAllByTestId('radio');
    expect(radios).toHaveLength(3);

    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    expect(screen.getByText('User Manager')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });

  it('passes the whiteLabelKey to the role description', () => {
    render(<RoleSelector whiteLabelKey={whiteLabelKey} />);

    expect(
      screen.getByText(/User can access data through the SDE platform./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /User can add and manage other users on the SDE platform./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /User can access data and manage other users on the SDE platform./,
      ),
    ).toBeInTheDocument();
  });

  it('renders error messages when errors are provided', () => {
    render(
      <RoleSelector
        whiteLabelKey={whiteLabelKey}
        errors={['Role is required', 'Another error']}
      />,
    );

    expect(screen.getByText('Role is required')).toBeInTheDocument();
    expect(screen.getByText('Another error')).toBeInTheDocument();
  });

  it('passes generated error_ids to RadioButtonInputField', () => {
    render(
      <RoleSelector
        whiteLabelKey={whiteLabelKey}
        errors={['Role is required']}
      />,
    );

    const call = (RadioButtonInputField as jest.Mock).mock.calls[0][0];
    expect(call.error_ids).toEqual(['role-error-0']);
  });

  it('throws if analystDescriptionMap is missing the whiteLabelKey', () => {
    const BrokenRoleSelector = loadRoleSelectorWithMaps({
      analystDescriptionMap: {},
    });

    expect(() =>
      render(<BrokenRoleSelector whiteLabelKey='snowman' />),
    ).toThrow('analystDescriptionMap entry missing: snowman');
  });

  it('throws if userManagerDescriptionMap is missing the whiteLabelKey', () => {
    const BrokenRoleSelector = loadRoleSelectorWithMaps({
      analystDescriptionMap: { snowman: 'ok' },
      userManagerDescriptionMap: {},
    });

    expect(() =>
      render(<BrokenRoleSelector whiteLabelKey='snowman' />),
    ).toThrow('userManagerDescriptionMap entry missing: snowman');
  });

  it('throws if bothDescriptionMap is missing the whiteLabelKey', () => {
    const BrokenRoleSelector = loadRoleSelectorWithMaps({
      analystDescriptionMap: { snowman: 'ok' },
      userManagerDescriptionMap: { snowman: 'ok' },
      bothDescriptionMap: {},
    });

    expect(() =>
      render(<BrokenRoleSelector whiteLabelKey='snowman' />),
    ).toThrow('bothDescriptionMap entry missing: snowman');
  });
});
