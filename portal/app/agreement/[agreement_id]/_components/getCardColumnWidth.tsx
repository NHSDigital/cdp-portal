export default function getCardColumnWidth(totalCards: number): string {
  switch (totalCards) {
    case 1:
      return 'nhsuk-grid-column-two-thirds';
    case 2:
      return 'nhsuk-grid-column-one-half';
    case 3:
      return 'nhsuk-grid-column-one-third';
    case 4:
      return 'nhsuk-grid-column-one-half';
    default:
      return 'nhsuk-grid-column-one-third';
  }
}
