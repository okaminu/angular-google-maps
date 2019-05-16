import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { GoogleMapsSingleton } from './google-maps-singleton.service'
import Map = google.maps.Map

@Injectable()
export class AngularGoogleMapsService {

    constructor(private googleMaps: GoogleMapsSingleton,
                private eventPublisher: EventPublisher) {
    }

    createSearchBox(map: Map) {
        const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
        const searchBox = new this.googleMaps.singleton.places.SearchBox(searchBoxInput)

        map.controls[this.googleMaps.singleton.ControlPosition.TOP_LEFT].push(searchBoxInput)

        return searchBox
    }

    reverseGeocode(location: Location) {
        const latLng = new this.googleMaps.singleton.LatLng(location.latitude, location.longitude)
        new this.googleMaps.singleton.Geocoder().geocode({'location': latLng}, results => {
            if (results !== null && results[0])
                this.eventPublisher.notify('addressReverseGeocoded', results[0].formatted_address)
            else
                this.eventPublisher.notify('addressReverseGeocoded', latLng.toString())
        })
    }

    geocode(address: String): Promise<any> {
        return new this.googleMaps.singleton.Geocoder().geocode({'address': address}, results => {
            if (results !== null && results[0])
                this.eventPublisher.notify('onGeocodeAddress', new Location(results[0].geometry.location.lat(),
                    results[0].geometry.location.lng()))
            else
                this.eventPublisher.notify('onGeocodeAddress', new Location(59.9139, 10.7522))

        })
    }

    addResizeControl(map: google.maps.Map) {
        const resizeControl = document.getElementById('resize-control')
        map.controls[this.googleMaps.singleton.ControlPosition.TOP_RIGHT].push(resizeControl)
        return Promise.resolve(resizeControl)
    }

}
