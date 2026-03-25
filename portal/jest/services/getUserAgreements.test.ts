import callLambdaWithFullErrorChecking from 'app/shared/callLambda';

import hasPermissions from '@/app/services/hasPermissions';
import getAllAgreements from '@/services/getAllAgreements';
import getUserAgreements, {
  UserAgreementsResult,
} from '@/services/getUserAgreements';

jest.mock('app/shared/callLambda');
jest.mock('@/app/services/hasPermissions');
jest.mock('@/services/getAllAgreements');

describe('getUserAgreements tests', () => {
  const mockUserEmail = 'jacko@lantern.com';
  const mockAgreement1 = 'pumpkin-spiced-agreement';
  const mockAgreement2 = 'candy-corn-agreement';

  const lambdaResponse = {
    body: JSON.stringify({
      agreements: [
        {
          agreement_id: mockAgreement1,
          user_enabled_in_agreement: true,
          user_induction_required: true,
          application_roles: ['Analyst'],
        },
        {
          agreement_id: mockAgreement2,
          user_enabled_in_agreement: false,
          user_induction_required: false,
          application_roles: ['Analyst'],
        },
      ],
      induction: {
        passed: true,
      },
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue(
      lambdaResponse,
    );
    (hasPermissions as jest.Mock).mockResolvedValue(false);
    (getAllAgreements as jest.Mock).mockResolvedValue([]);
  });

  it('returns active agreements filtered by user_enabled_in_agreement', async () => {
    const result: UserAgreementsResult = await getUserAgreements(mockUserEmail);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        raw_payload: { user_id: mockUserEmail },
      }),
    );

    expect(result.selectedAgreement).toBeNull();
    expect(result.activeAgreements).toHaveLength(1);
    expect(result.activeAgreements[0].agreement_id).toBe(mockAgreement1);
  });

  it('correctly sets inductionPassed and inductionNeeded', async () => {
    const result = await getUserAgreements(mockUserEmail);
    expect(result.inductionPassed).toBe(true);
    expect(result.inductionNeeded).toBe(true);
  });

  it('does not add extra agreements if user lacks SEE_ALL_AGREEMENTS permission', async () => {
    const result = await getUserAgreements(mockUserEmail);
    expect(result.activeAgreements).toEqual([
      {
        agreement_id: 'pumpkin-spiced-agreement',
        application_roles: ['Analyst'],
        user_enabled_in_agreement: true,
        user_induction_required: true,
      },
    ]);
    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: ['portal.see_all_agreements'],
      user_email: mockUserEmail,
    });
    expect(getAllAgreements).not.toHaveBeenCalled();
  });

  it('adds extra agreements if user has SEE_ALL_AGREEMENTS permission', async () => {
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAllAgreements as jest.Mock).mockImplementation((prefix: string) => {
      if (prefix === 'agreement-dsa-')
        return Promise.resolve([
          { agreement_id: 'DSA-001', meaningful_name: 'DSA 1' },
        ]);
      if (prefix === 'agreement-demo')
        return Promise.resolve([
          { agreement_id: 'DEMO-001', meaningful_name: 'Demo 1' },
        ]);
      return Promise.resolve([]);
    });

    const result = await getUserAgreements(mockUserEmail);
    const ids = result.activeAgreements.map((a) => a.agreement_id);

    expect(ids).toContain(mockAgreement1);
    expect(ids).toContain('DSA-001');
    expect(ids).toContain('DEMO-001');
  });

  it('does not duplicate agreements when merging', async () => {
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAllAgreements as jest.Mock).mockImplementation((prefix: string) => {
      if (prefix === 'agreement-dsa-') {
        return Promise.resolve([
          {
            agreement_id: mockAgreement1,
            meaningful_name: 'Duplicate Agreement',
          },
        ]);
      }
      if (prefix === 'agreement-demo') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const result = await getUserAgreements(mockUserEmail);
    const ids = result.activeAgreements.map((a) => a.agreement_id);

    expect(ids.filter((id) => id === mockAgreement1)).toHaveLength(1);
  });

  it('handles empty lambda response gracefully', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({ agreements: [], induction: { passed: false } }),
    });

    const result = await getUserAgreements(mockUserEmail);

    expect(result.activeAgreements).toHaveLength(0);
    expect(result.inductionPassed).toBe(false);
    expect(result.inductionNeeded).toBe(false);
    expect(result.selectedAgreement).toBeNull();
  });

  it('sets inductionNeeded to false if user_induction_required is false', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        agreements: [
          {
            agreement_id: mockAgreement1,
            user_enabled_in_agreement: true,
            user_induction_required: false,
            application_roles: ['Analyst'],
          },
        ],
        induction: {
          passed: true,
        },
      }),
    });

    const result = await getUserAgreements(mockUserEmail);

    expect(result.inductionNeeded).toBe(false);
  });

  it('sets inductionNeeded to false if user does not have relevant roles', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue({
      body: JSON.stringify({
        agreements: [
          {
            agreement_id: mockAgreement1,
            user_enabled_in_agreement: true,
            user_induction_required: true,
            application_roles: ['SomeOtherRole'],
          },
        ],
        induction: {
          passed: true,
        },
      }),
    });

    const result = await getUserAgreements(mockUserEmail);

    expect(result.inductionNeeded).toBe(false);
  });
});
