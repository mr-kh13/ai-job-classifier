export const LEVELS = {
  full: 1,
  strong: 0.75,
  partial: 0.5,
  weak: 0.25,
  none: 0,
} as const;

export const DIMENSIONS = {
  stack: {
    label: "Stack",
    points: 40,
    judge:
      "Technologies the posting requires, versus the ones the resume shows. A partial match is acceptable: reserve weak and none for almost no overlap. Follow any stack guidance in the preferences",
  },
  domain: {
    label: "Domain",
    points: 60,
    judge:
      "How well the job description matches the resume and what the preferences say the candidate is looking for: roles, responsibilities and industries. A partial match is acceptable: reserve weak and none for almost no overlap",
  },
} as const;

type Level = keyof typeof LEVELS;
type DimensionKey = keyof typeof DIMENSIONS;

export const levelNames = Object.keys(LEVELS) as [Level, ...Level[]];
export const dimensionKeys = Object.keys(DIMENSIONS) as DimensionKey[];
