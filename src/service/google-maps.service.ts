import { Injectable } from '@angular/core'
import { Location } from '../location'
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Injectable()
export class GoogleMapsService {

    getGoogleMaps(): any {
        return google.maps
    }

    createMap(options: MapOptions) {
        return new google.maps.Map(document.getElementById('map'), options)
    }

    createMarker(options: MarkerOptions) {
        return new google.maps.Marker(options)
    }

    createSearchBox() {
        const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
        return new google.maps.places.SearchBox(searchBoxInput)
    }

    createLatLng(location: Location) {
        return new google.maps.LatLng(location.latitude, location.longitude)
    }

    createGeocoder() {
        return new google.maps.Geocoder()
    }

}
