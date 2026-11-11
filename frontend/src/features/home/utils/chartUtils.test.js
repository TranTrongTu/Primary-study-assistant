import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getStartDateFromFilter,
  transformCountData,
  transformHeatmapData,
  transformScoreData,
} from './chartUtils'

describe('transformScoreData', () => {
  it('always returns the three subjects in a fixed order, even with no data', () => {
    const result = transformScoreData(null)

    expect(result).toHaveLength(3)
    expect(result.every((subject) => subject.percentage === 0)).toBe(true)
  })

  it('computes the percentage for the subjects the API returned', () => {
    const [maths, vietnamese, english] = transformScoreData([
      ['45', '60', 'MATHS'],
      ['1', '3', 'ENGLISH'],
    ])

    expect(maths).toMatchObject({ achieved: 45, max: 60, percentage: 75 })
    expect(vietnamese.percentage).toBe(0)
    expect(english.percentage).toBe(33.33)
  })

  it('ignores an unknown subject and a zero maximum', () => {
    const [maths] = transformScoreData([
      ['10', '0', 'MATHS'],
      ['5', '10', 'HISTORY'],
    ])

    expect(maths.percentage).toBe(0)
  })
})

describe('transformCountData', () => {
  const totalPercent = (slices) =>
    slices.reduce((sum, slice) => sum + Number(slice.displayPercent), 0)

  it('makes the displayed percentages add up to exactly 100', () => {
    // 1/3 each would naively show 33.3 + 33.3 + 33.3 = 99.9
    const slices = transformCountData([
      [1, 'MATHS'],
      [1, 'VIETNAMESE'],
      [1, 'ENGLISH'],
    ])

    expect(totalPercent(slices)).toBeCloseTo(100, 5)
    expect(slices.map((slice) => slice.count)).toEqual([1, 1, 1])
  })

  it('keeps the slices in the order the API sent them', () => {
    const slices = transformCountData([
      [1, 'ENGLISH'],
      [5, 'MATHS'],
      [1, 'VIETNAMESE'],
    ])

    expect(slices.map((slice) => slice.count)).toEqual([1, 5, 1])
    expect(totalPercent(slices)).toBeCloseTo(100, 5)
  })

  it('returns an empty list for missing data and no percentages when all counts are 0', () => {
    expect(transformCountData(undefined)).toEqual([])
    expect(transformCountData([[0, 'MATHS']])[0].displayPercent).toBeUndefined()
  })
})

describe('date-dependent helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 3, 12)) // 3 March 2026, local time
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('getStartDateFromFilter formats the start date as ddmmyyyy across a month boundary', () => {
    expect(getStartDateFromFilter('Theo ngày')).toBe('02032026')
    expect(getStartDateFromFilter('Theo tuần')).toBe('24022026')
    expect(getStartDateFromFilter(30)).toBe('01022026')
    expect(getStartDateFromFilter('anything else')).toBe('24022026')
  })

  it('transformHeatmapData fills every day and maps counts to colour levels', () => {
    const days = transformHeatmapData(
      [
        [2, '2026-03-03'],
        [11, '2026-03-01'],
      ],
      3,
    )

    expect(days).toEqual([
      { date: '2026-03-01', count: 11, level: 4 },
      { date: '2026-03-02', count: 0, level: 0 },
      { date: '2026-03-03', count: 2, level: 1 },
    ])
  })

  it('transformHeatmapData returns an empty calendar when the API gives nothing', () => {
    const days = transformHeatmapData(null, 90)

    expect(days).toHaveLength(90)
    expect(days.at(-1)).toEqual({ date: '2026-03-03', count: 0, level: 0 })
  })
})
