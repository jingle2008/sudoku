import { BOX_SIZE, GRID_SIZE, Group } from "./constants";

/**
 * Class representing a coordinate (row, column) on a Sudoku grid
 */
export class Coord {
    /** The row index (0-based) */
    readonly row: number;
    /** The column index (0-based) */
    readonly col: number;

    /**
     * Create a Coord instance from a linear index
     * @param index - The linear index (0 to GRID_SIZE*GRID_SIZE-1)
     * @returns A Coord instance corresponding to the index
     */
    static fromIndex(index: number): Coord {
        if (index < 0 || index >= GRID_SIZE * GRID_SIZE) {
            throw new RangeError(`Index ${index} is out of bounds`);
        }
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        return new Coord(row, col);
    }

    /**
     * Construct a Coord
     * @param row - Row index (0-based)
     * @param col - Column index (0-based)
     */
    constructor(row: number, col: number) {
        if (row < 0 || row >= GRID_SIZE) {
            throw new RangeError(`Row ${row} is out of bounds`);
        }
        if (col < 0 || col >= GRID_SIZE) {
            throw new RangeError(`Column ${col} is out of bounds`);
        }

        this.row = row;
        this.col = col;
    }

    /** Get the linear index representation of this coordinate */
    get index(): number {
        return this.row * GRID_SIZE + this.col;
    }

    /** Get the origin coordinate of the box containing this coordinate */
    get boxOrigin(): Coord {
        return new Coord(
            Math.floor(this.row / BOX_SIZE) * BOX_SIZE,
            Math.floor(this.col / BOX_SIZE) * BOX_SIZE
        );
    }

    /**
     * Return a new Coord with a different row but same column
     * @param row - The new row index
     * @returns New Coord instance
     */
    withRow(row: number): Coord {
        return new Coord(row, this.col);
    }

    /**
     * Return a new Coord with a different column but same row
     * @param col - The new column index
     * @returns New Coord instance
     */
    withCol(col: number): Coord {
        return new Coord(this.row, col);
    }

    /**
     * Get coordinates in the same row, column, or box as defined by group, excluding any skipped coordinates
     * @param group - One of 'row', 'column', or 'box'
     * @param skips - Array of Coord instances to skip
     * @returns Array of Coord instances in the group excluding skips
     */
    coordsFor(
        group: Group,
        skips: Coord[] = []
    ): Coord[] {
        const coords: Coord[] = [];
        const skipIdx = new Set(skips.map(c => c.index));

        if (group === 'row') {
            for (let c = 0; c < GRID_SIZE; c++) {
                const idx = this.row * GRID_SIZE + c;
                if (!skipIdx.has(idx)) coords.push(this.withCol(c));
            }
        } else if (group === 'column') {
            for (let r = 0; r < GRID_SIZE; r++) {
                const idx = r * GRID_SIZE + this.col;
                if (!skipIdx.has(idx)) coords.push(this.withRow(r));
            }
        } else {
            const { row: br, col: bc } = this.boxOrigin;
            for (let r = br; r < br + BOX_SIZE; r++) {
                for (let c = bc; c < bc + BOX_SIZE; c++) {
                    const idx = r * GRID_SIZE + c;
                    if (!skipIdx.has(idx)) coords.push(new Coord(r, c));
                }
            }
        }
        return coords;
    }

    /**
     * Check equality with another Coord instance
     * @param other - Coord to compare with
     * @returns True if rows and columns are the same, otherwise false
     */
    equals(other: Coord): boolean {
        return other instanceof Coord && this.row === other.row && this.col === other.col;
    }

    /** Get a string hash code representation */
    hashCode(): string {
        return `${this.row},${this.col}`;
    }

    /** Create a clone of this Coord */
    clone(): Coord {
        return new Coord(this.row, this.col);
    }
};
