export const BOX_SIZE = 3;
export const GRID_SIZE = BOX_SIZE * BOX_SIZE;

export enum Group {
    Row = 'row',
    Column = 'column',
    Box = 'box'
}

export class Coord {
    readonly row: number;
    readonly col: number;

    static fromIndex(index: number): Coord {
        if (index < 0 || index >= GRID_SIZE * GRID_SIZE) {
            throw new RangeError(`Index ${index} is out of bounds`);
        }
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        return new Coord(row, col);
    }

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

    get index(): number {
        return this.row * GRID_SIZE + this.col;
    }

    get boxOrigin(): Coord {
        return new Coord(
            Math.floor(this.row / BOX_SIZE) * BOX_SIZE,
            Math.floor(this.col / BOX_SIZE) * BOX_SIZE
        );
    }

    withRow(row: number): Coord {
        return new Coord(row, this.col);
    }

    withCol(col: number): Coord {
        return new Coord(this.row, col);
    }

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

    equals(other: Coord): boolean {
        return other instanceof Coord && this.row === other.row && this.col === other.col;
    }

    hashCode(): string {
        return `${this.row},${this.col}`;
    }

    clone(): Coord {
        return new Coord(this.row, this.col);
    }
};