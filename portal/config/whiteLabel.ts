export type WhiteLabelKey = 'SDE' | 'CDP';

export type WhiteLabelEntry = {
  acronym: WhiteLabelKey;
  longName: string;
};

type WhiteLabelValuesType = {
  [key in WhiteLabelKey]: WhiteLabelEntry;
};

const WhiteLabelValues: WhiteLabelValuesType = {
  SDE: {
    acronym: 'SDE',
    longName: 'Secure Data Environment',
  },
  CDP: {
    acronym: 'CDP',
    longName: 'Common Data Platform',
  },
};

export function getWhiteLabelValues(): WhiteLabelEntry {
  const rawKey = process.env.PORTAL_SERVICE;

  if (!rawKey) throw new Error('PORTAL_SERVICE is undefined');

  const whiteLabelKey = rawKey.toUpperCase();

  if (!(whiteLabelKey in WhiteLabelValues)) {
    throw new Error(`Invalid value for PORTAL_SERVICE: ${whiteLabelKey}`);
  }

  return WhiteLabelValues[whiteLabelKey];
}
