import { isCalendarDate, localDateString } from '../../src/domain/calendar';

it('validates real calendar dates instead of accepting normalized overflows', () => {
  expect(isCalendarDate('2026-02-31')).toBe(false);
  expect(isCalendarDate('2026-02-29')).toBe(false);
  expect(isCalendarDate('1900-02-29')).toBe(false);
  expect(isCalendarDate('2000-02-29')).toBe(true);
  expect(isCalendarDate('10000-01-01')).toBe(false);
});

it('formats the local calendar day instead of deriving it from UTC', () => {
  const local = new Date(2026, 9, 8, 0, 30);
  expect(localDateString(local)).toBe('2026-10-08');
});
