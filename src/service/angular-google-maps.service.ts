import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { GoogleMapsSingleton } from './google-maps-singleton.service'
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import SearchBox = google.maps.places.SearchBox

@Injectable()
export class AngularGoogleMapsService {

    constructor(private googleMaps: GoogleMapsSingleton,
                private eventPublisher: EventPublisher) {
    }

    createMap(options: MapOptions) {
        return Promise.resolve(new this.googleMaps.singleton.Map(document.getElementById('map'), options))
    }

    addMarker(options: MarkerOptions) {
        const marker: Marker = new this.googleMaps.singleton.Marker(options)

        marker.addListener('dragend', this.getLocationChangedHandler())
        marker.addListener('dblclick', this.getLocationDeletedMarkerHandler(marker))

        return Promise.resolve(marker)
    }

    bindMarkerToMapClick(marker: Marker, map: Map) {
        map.addListener('click', this.getBindMarkerToMapHandler(marker, map))
    }

    addSearchBox(map: Map, markerToBind: Marker) {
        const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
        const searchBox = new this.googleMaps.singleton.places.SearchBox(searchBoxInput)

        map.controls[this.googleMaps.singleton.ControlPosition.TOP_LEFT].push(searchBoxInput)

        searchBox.addListener('places_changed',
            this.getLocationChangedSearchBoxMapMarkerHandler(searchBox, map, markerToBind))

        return Promise.resolve(searchBox)
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

    private getLocationDeletedMarkerHandler(marker: Marker) {
        return () => {
            marker.setMap(null)
            this.eventPublisher.notify('locationDeleted')

            const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
            searchBoxInput.value = ''
        }
    }

    private getLocationChangedHandler() {
        return mouseEvent => {
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    private getBindMarkerToMapHandler(marker: Marker, map: Map) {
        return mouseEvent => {
            marker.setMap(map)
            marker.setPosition(mouseEvent.latLng)
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    private getLocationChangedSearchBoxMapMarkerHandler(searchBox: SearchBox, map: Map, marker: Marker) {
        return () => {
            const placeLocation = searchBox.getPlaces()[0].geometry.location
            map.panTo(placeLocation)
            map.setZoom(15)
            marker.setMap(map)
            marker.setPosition(placeLocation)
            this.eventPublisher.notify('locationChanged', new Location(placeLocation.lat(), placeLocation.lng()))
        }
    }
}