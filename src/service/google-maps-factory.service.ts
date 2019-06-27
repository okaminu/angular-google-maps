import { Injectable } from '@angular/core'
import { Coordinates } from '../coordinates'
import Circle = google.maps.Circle
import CircleOptions = google.maps.CircleOptions
import Geocoder = google.maps.Geocoder
import LatLng = google.maps.LatLng
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import SearchBox = google.maps.places.SearchBox

@Injectable()
export class GoogleMapsFactory {

    getGoogleMaps(): any {
        return google.maps
    }

    createMap(options: MapOptions): Map {
        return new google.maps.Map(document.getElementById('map'), options)
    }

    createCircle(options: CircleOptions): Circle {
        return new google.maps.Circle(options)
    }

    createMarker(options: MarkerOptions): Marker {
        return new google.maps.Marker(options)
    }

    createSearchBox(): SearchBox {
        return new google.maps.places.SearchBox(<HTMLInputElement>document.getElementById('search-input'))
    }

    createLatLng(coordinates: Coordinates): LatLng {
        return new google.maps.LatLng(coordinates.latitude, coordinates.longitude)
    }

    createGeocoder(): Geocoder {
        return new google.maps.Geocoder()
    }

    getSearchBoxInput() {
        return <HTMLInputElement>document.getElementById('search-input')
    }

}
