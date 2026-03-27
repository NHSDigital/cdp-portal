import { render } from '@testing-library/react';
import * as navigation from 'next/navigation';

import AddUserForm from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserForm';
import AddUserPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/page';
import { createRandomId } from '@/app/shared/createRandomId';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/_components/submitAddUserForm',
  () => jest.fn(),
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserForm',
  () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid='add-user-form' />),
  }),
);
jest.mock('@/app/shared/createRandomId', () => ({
  __esModule: true,
  createRandomId: jest.fn(() => 'new123'),
}));

describe('AddUserPage', () => {
  const agreement_id = 'agreement123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the AddUserForm when form_id and user_id are provided', async () => {
    const searchParams = {
      form_id: 'abc123',
      user_id: 'user456',
    };
    const props = {
      params: { agreement_id },
      searchParams,
    };
    const { findByTestId } = render(await AddUserPage(props));

    expect(await findByTestId('add-user-form')).toBeInTheDocument();

    expect(createRandomId).not.toHaveBeenCalled();
    expect(navigation.redirect).not.toHaveBeenCalled();
    expect(AddUserForm).toHaveBeenCalledWith(
      expect.objectContaining({
        agreement_id,
        form_id: 'abc123',
        user_id: 'user456',
        addUserAction: expect.any(Function),
      }),
      expect.anything(),
    );
  });

  it('creates a form_id and user_id and redirects when form_id and user_id are missing', async () => {
    const props = {
      params: { agreement_id },
      searchParams: {},
    };

    await AddUserPage(props);
    expect(createRandomId).toHaveBeenCalledTimes(2);
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=new123',
    );
  });

  it('creates a user_id and redirects if only form_id is provided', async () => {
    const props = {
      params: { agreement_id },
      searchParams: { form_id: 'formyMcform' },
    };

    await AddUserPage(props);

    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=formyMcform&user_id=new123',
    );
  });

  it('creates a form_id and redirects if only user_id is provided', async () => {
    const props = {
      params: { agreement_id },
      searchParams: { user_id: 'McUserson' },
    };

    await AddUserPage(props);

    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=McUserson',
    );
  });

  it('creates a user_id and redirects when user_id is not a string', async () => {
    const props = {
      params: { agreement_id },
      searchParams: {
        form_id: 'valid-form-id',
        user_id: ['not', 'a', 'string'],
      },
    };

    await AddUserPage(props);

    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=valid-form-id&user_id=new123',
    );
  });

  it('creates a form_id and redirects when form_id is not a string', async () => {
    const props = {
      params: { agreement_id },
      searchParams: {
        form_id: ['not', 'a', 'string'],
        user_id: 'valid-user-id',
      },
    };

    await AddUserPage(props);

    expect(navigation.redirect).toHaveBeenCalledTimes(1);
    expect(createRandomId).toHaveBeenCalledTimes(1);
    expect(navigation.redirect).toHaveBeenCalledWith(
      '/agreement/agreement123/manage-users/add-user?form_id=new123&user_id=valid-user-id',
    );
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(`Add a new user - ${whiteLabelValues.acronym}`);
  });
});
