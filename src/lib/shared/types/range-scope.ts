export const RangeScope = {
  Month: 'month',
  Quarter: 'quarter',
  Year: 'year',
  Ytd: 'ytd',
  LastYear: 'lastyear',
  ThreeYears: '3years',
  FiveYears: '5years',
  All: 'all',
  Custom: 'custom',
} as const

export type RangeScope = (typeof RangeScope)[keyof typeof RangeScope]
