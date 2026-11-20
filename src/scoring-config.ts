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
      "The technologies the posting requires (languages, frameworks, cloud, databases; ignore nice-to-haves), versus the ones the resume shows. Count a closely related technology as shown, such as another cloud provider or SQL database. Follow any stack guidance in the preferences",
  },
  domain: {
    label: "Domain",
    points: 60,
    judge:
      "The posting's main responsibilities (up to five), versus the resume's direct or closely related experience. Count a similar kind of work as shown. Also compare the role and industry to what the preferences say the candidate is looking for",
  },
} as const;

type Level = keyof typeof LEVELS;
type DimensionKey = keyof typeof DIMENSIONS;

export const levelNames = Object.keys(LEVELS) as [Level, ...Level[]];
export const dimensionKeys = Object.keys(DIMENSIONS) as DimensionKey[];
