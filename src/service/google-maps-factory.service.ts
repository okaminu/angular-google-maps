import { Injectable } from '@angular/core'
import { Coordinates } from '../value-object/coordinates'
import Circle = google.maps.Circle
import CircleOptions = google.maps.CircleOptions
import Geocoder = google.maps.Geocoder
import LatLng = google.maps.LatLng
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import SearchBox = google.maps.places.SearchBox
import Polyline = google.maps.Polyline
import PolylineOptions = google.maps.PolylineOptions

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

    createPolyline(options: PolylineOptions): Polyline {
        return new google.maps.Polyline(options)
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

    createSize(width: number, height: number) {
        return new google.maps.Size(width, height)
    }

    createPoint(x: number, y: number) {
        return new google.maps.Point(x, y)
    }

}
