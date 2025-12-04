import { cleanScannerString } from './scannerSanitizer';

describe('cleanScannerString', () => {
  test('removes control/non-printable characters', () => {
    const input = 'ab\x00\x1Fcd';
    expect(cleanScannerString(input)).toBe('abcd');
  });

  test('collapses duplicated braces/quotes/colons/commas', () => {
    const input = '{{""key""::""value""}}';
    expect(cleanScannerString(input)).toBe('{"key":"value"}');
  });

  test('collapses long repeated runs and hyphens', () => {
    const input = 'SS2255--228811111155';
    // collapse runs of 3+ (the six 1s collapse to a single '1', double hyphen -> single)
    expect(cleanScannerString(input)).toBe('SS2255-2288155');
  });

  test('trims whitespace', () => {
    expect(cleanScannerString('   foo  ')).toBe('foo');
  });
});
