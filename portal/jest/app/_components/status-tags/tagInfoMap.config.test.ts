import { tagInfoConfigMap } from '@/app/_components/status-tags/tagInfoMap.config';

import { WhiteLabelKey } from '../../../../config/whiteLabel';

describe('Pending Induction tag', () => {
  it('activated has the correct id and description', () => {
    expect(tagInfoConfigMap.Activated).toEqual({
      id: 'activated',
      description: 'User has access to the SDE.',
    });
  });

  it('deactivated has the correct id and description', () => {
    expect(tagInfoConfigMap.Deactivated).toEqual({
      id: 'deactivated',
      description:
        'User account is temporarily closed but can be reactivated at any time.',
    });
  });

  it('pending induction has the correct id and description', () => {
    expect(tagInfoConfigMap['Pending Induction']).toEqual({
      id: 'pending-induction',
      description:
        'User has been sent induction assessment invite email but has not yet passed the assessment.',
      show: expect.any(Function),
    });
  });

  const pendingInduction = tagInfoConfigMap['Pending Induction'];

  if (!pendingInduction?.show) {
    throw new Error('Pending Induction tag is missing a show function');
  }

  const show = pendingInduction.show;

  it('returns true for SDE white label', () => {
    expect(show({ whiteLabelKey: 'SDE' as WhiteLabelKey })).toBe(true);
  });

  it('returns false for CDP white label', () => {
    expect(show({ whiteLabelKey: 'CDP' as WhiteLabelKey })).toBe(false);
  });

  it('throws if whiteLabelKey is unsupported', () => {
    expect(() => show({ whiteLabelKey: 'snowman' as WhiteLabelKey })).toThrow(
      'tagInfoMap entry missing: snowman',
    );
  });
});
