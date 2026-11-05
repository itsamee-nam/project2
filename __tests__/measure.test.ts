import { formatFraction, measureToGrams, scaleMeasure } from '../src/utils/measure';

describe('scaleMeasure', () => {
  it('scales plain numbers with units', () => {
    expect(scaleMeasure('250g', 2)).toBe('500g');
    expect(scaleMeasure('2 tbsp', 2)).toBe('4 tbsp');
    expect(scaleMeasure('1 medium', 3)).toBe('3 medium');
  });
  it('handles fractions and mixed numbers', () => {
    expect(scaleMeasure('1/2 cup', 2)).toBe('1 cup');
    expect(scaleMeasure('1 1/2 cups', 2)).toBe('3 cups');
    expect(scaleMeasure('1/2 tsp', 1.5)).toBe('3/4 tsp');
    expect(scaleMeasure('1 cup', 0.5)).toBe('1/2 cup');
  });
  it('handles ranges', () => {
    expect(scaleMeasure('4-6 medium', 2)).toBe('8-12 medium');
    expect(scaleMeasure('3-4 pieces', 0.5)).toBe('1 1/2-2 pieces');
  });
  it('handles unicode fractions', () => {
    expect(scaleMeasure('½ cup', 2)).toBe('1 cup');
  });
  it('leaves non-numeric measures alone', () => {
    expect(scaleMeasure('to taste', 4)).toBe('to taste');
    expect(scaleMeasure('', 4)).toBe('');
    expect(scaleMeasure('pinch', 2)).toBe('pinch');
  });
  it('keeps text after the number', () => {
    expect(scaleMeasure('1 tbsp minced', 2)).toBe('2 tbsp minced');
  });
  it('returns the same text when factor is 1', () => {
    expect(scaleMeasure('1 1/2 cups', 1)).toBe('1 1/2 cups');
  });
});

describe('formatFraction', () => {
  it('formats nicely', () => {
    expect(formatFraction(3)).toBe('3');
    expect(formatFraction(0.33)).toBe('1/3');
    expect(formatFraction(2.5)).toBe('2 1/2');
    expect(formatFraction(0.99)).toBe('1');
  });
});

describe('measureToGrams', () => {
  it('converts metric and volume units', () => {
    expect(measureToGrams('250g')).toBe(250);
    expect(measureToGrams('1.5 kg')).toBe(1500);
    expect(measureToGrams('2 cups', { cupG: 100 })).toBe(200);
    expect(measureToGrams('1 tbsp', { tbspG: 14 })).toBe(14);
  });
  it('uses piece weight for counts and sizes', () => {
    expect(measureToGrams('2 medium', { pieceG: 100 })).toBe(200);
    expect(measureToGrams('3', { pieceG: 50 })).toBe(150);
    expect(measureToGrams('5 cloves')).toBe(20);
  });
  it('returns null when unknown', () => {
    expect(measureToGrams('to taste')).toBeNull();
  });
});
