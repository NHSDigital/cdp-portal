import getCardColumnWidth from '@/app/agreement/[agreement_id]/_components/getCardColumnWidth';

describe('getCardColumnWidth', () => {
  it.each([
    [1, 'nhsuk-grid-column-two-thirds'],
    [2, 'nhsuk-grid-column-one-half'],
    [3, 'nhsuk-grid-column-one-third'],
    [4, 'nhsuk-grid-column-one-half'],
    [999, 'nhsuk-grid-column-one-third'],
    [0, 'nhsuk-grid-column-one-third'],
  ])('when totalCards is %s, returns %s', (totalCards, expected) => {
    expect(getCardColumnWidth(totalCards)).toBe(expected);
  });
});
