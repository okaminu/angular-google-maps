import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { GoogleMapsFactory } from './google-maps-factory.service'

@Injectable()
export class AngularGoogleMapsGeocoder {

    constructor(private googleMaps: GoogleMapsFactory,
                private eventPublisher: EventPublisher) {
    }

    geocode(address: string, callback: (Location) => void) {
        return this.googleMaps.createGeocoder().geocode({'address': address}, results => {
            if (results !== null && results[0])
                callback(new Location(results[0].geometry.location.lat(), results[0].geometry.location.lng()))
            else
                callback(new Location(59.9139, 10.7522))
        })
    }

    reverseGeocode(location: Location) {
        const latLng = this.googleMaps.createLatLng(location)
        this.googleMaps.createGeocoder().geocode({'location': latLng}, results => {
            if (results !== null && results[0])
                this.eventPublisher.notify('addressReverseGeocoded', results[0].formatted_address)
            else
                this.eventPublisher.notify('addressReverseGeocoded', latLng.toString())
        })
    }

}
