import { describe, it, expect } from 'vitest';
import { Coord } from './coord';

describe('Coord class', () => {
  it('creates Coord from index', () => {
    const coord = Coord.fromIndex(10);
    expect(coord.row).toBe(1);
    expect(coord.col).toBe(1);
  });

  it('throws error on invalid index', () => {
    expect(() => Coord.fromIndex(-1)).toThrow();
    expect(() => Coord.fromIndex(81)).toThrow();
  });

  it('returns correct index', () => {
    const coord = new Coord(2, 3);
    expect(coord.index).toBe(2 * 9 + 3);
  });

  it('calculates boxOrigin correctly', () => {
    const coord = new Coord(4, 7);
    const origin = coord.boxOrigin;
    expect(origin.row).toBe(3);
    expect(origin.col).toBe(6);
  });

  it('creates new Coord with changed row', () => {
    const coord = new Coord(4, 7);
    const newCoord = coord.withRow(6);
    expect(newCoord.row).toBe(6);
    expect(newCoord.col).toBe(7);
  });

  it('creates new Coord with changed col', () => {
    const coord = new Coord(4, 7);
    const newCoord = coord.withCol(3);
    expect(newCoord.row).toBe(4);
    expect(newCoord.col).toBe(3);
  });

  it('returns coordsFor row group correctly', () => {
    const coord = new Coord(3, 4);
    const coords = coord.coordsFor('row' as import('./constants').Group);
    expect(coords.length).toBe(9);
    expect(coords.every(c => c.row === 3)).toBe(true);
  });

  it('returns coordsFor column group correctly', () => {
    const coord = new Coord(3, 4);
    const coords = coord.coordsFor('column' as import('./constants').Group);
    expect(coords.length).toBe(9);
    expect(coords.every(c => c.col === 4)).toBe(true);
  });

  it('returns coordsFor box group correctly', () => {
    const coord = new Coord(4, 4);
    const coords = coord.coordsFor('box' as import('./constants').Group);
    expect(coords.length).toBe(9);
    expect(coords.some(c => c.equals(coord))).toBe(true);
  });

  it('tests equals method', () => {
    const a = new Coord(1, 1);
    const b = new Coord(1, 1);
    const c = new Coord(2, 2);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('tests hashCode method', () => {
    const coord = new Coord(5, 6);
    expect(coord.hashCode()).toBe('5,6');
  });

  it('tests clone method', () => {
    const coord = new Coord(5, 6);
    const clone = coord.clone();
    expect(clone.equals(coord)).toBe(true);
    expect(clone).not.toBe(coord);
  });
});