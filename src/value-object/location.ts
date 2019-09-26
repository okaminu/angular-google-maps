import { Coordinates } from './coordinates'

export class Location {
    constructor(
        public coordinates: Coordinates,
        public radiusInMeters: number) {
    }
}