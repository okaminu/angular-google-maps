import { Injectable } from '@angular/core'
import { Coordinates } from '../coordinates'
import { GoogleMapsFactory } from './google-maps-factory.service'

@Injectable()
export class AngularGoogleMapsGeocoder {

    constructor(private googleMaps: GoogleMapsFactory) {
    }

    geocode(address: string, callback: (coordinates: Coordinates) => void) {
        return this.googleMaps.createGeocoder().geocode({'address': address}, results => {
            if (results !== null && results[0]) {
                callback(new Coordinates(results[0].geometry.location.lat(), results[0].geometry.location.lng()))
            } else
                callback(new Coordinates(59.9139, 10.7522))
        })
    }

    reverseGeocode(coordinates: Coordinates, callback: (string) => void) {
        const latLng = this.googleMaps.createLatLng(coordinates)
        this.googleMaps.createGeocoder().geocode({'location': latLng}, results => {
            if (results !== null && results[0])
                callback(results[0].formatted_address)
            else
                callback(latLng.toString())
        })
    }
}
