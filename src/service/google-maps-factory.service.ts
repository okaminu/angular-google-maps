import { Injectable } from '@angular/core'
import { Location } from '../location'
import CircleOptions = google.maps.CircleOptions
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Injectable()
export class GoogleMapsFactory {

    getGoogleMaps(): any {
        return google.maps
    }

    createMap(options: MapOptions) {
        return new google.maps.Map(document.getElementById('map'), options)
    }

    createCircle(options: CircleOptions) {
        return new google.maps.Circle(options)
    }

    createMarker(options: MarkerOptions) {
        return new google.maps.Marker(options)
    }

    createSearchBox() {
        return new google.maps.places.SearchBox(<HTMLInputElement>document.getElementById('search-input'))
    }

    createLatLng(location: Location) {
        return new google.maps.LatLng(location.latitude, location.longitude)
    }

    createGeocoder() {
        return new google.maps.Geocoder()
    }

    getSearchBoxInput() {
        return <HTMLInputElement>document.getElementById('search-input')
    }

}
