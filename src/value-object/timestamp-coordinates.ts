import { Coordinates } from './coordinates'

export class TimestampCoordinates {
    constructor(
        public coordinates: Coordinates,
        public timestamp: number
    ) {}
}
