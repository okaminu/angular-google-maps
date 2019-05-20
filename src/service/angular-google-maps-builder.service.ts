import { Injectable } from '@angular/core'
import { Location } from '../location'
import { AngularGoogleMapsListener } from './angular-google-maps-listener.service'
import { GoogleMapsService } from './google-maps.service'
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions

@Injectable()
export class AngularGoogleMapsBuilder {

    private map: Map
    private marker: Marker

    constructor(private googleMaps: GoogleMapsService,
                private googleMapsListeners: AngularGoogleMapsListener) {
    }

    createMap(mapOptions: MapOptions, focusLocation: Location) {
        mapOptions.center = {
            lat: focusLocation.latitude,
            lng: focusLocation.longitude
        }
        this.map = this.googleMaps.createMap(mapOptions)
        return this
    }

    addMarker(markerOptions: MarkerOptions, areMarkerLocationsProvided: boolean) {
        this.bindMarkerToMapsIfLocationIsProvided(markerOptions, areMarkerLocationsProvided)
        this.marker = this.googleMaps.createMarker(markerOptions)
        this.addMarkerListeners()
        return this
    }

    addSearchBox() {
        const searchBox = this.googleMaps.createSearchBox()

        searchBox.addListener('places_changed',
            this.googleMapsListeners.getLocationChangedSearchBoxMapMarkerHandler(searchBox, this.map, this.marker))

        return this
    }

    build() {
        return this.map
    }

    private addMarkerListeners() {
        this.marker.addListener('dragend', this.googleMapsListeners.getLocationChangedHandler())
        this.marker.addListener('dblclick', this.googleMapsListeners.getLocationDeletedMarkerHandler(this.marker))
        this.map.addListener('click', this.googleMapsListeners.getBindMarkerToMapHandler(this.marker, this.map))
    }

    private bindMarkerToMapsIfLocationIsProvided(markerOptions: MarkerOptions, isLocationProvided: boolean) {
        markerOptions.position = this.map.getCenter()
        if (isLocationProvided)
            markerOptions.map = this.map
    }
}
