import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Coordinates } from '../coordinates'
import { Location } from '../location'
import { AngularGoogleMapsGeocoder } from './angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from './google-maps-factory.service'
import Circle = google.maps.Circle
import CircleOptions = google.maps.CircleOptions
import LatLng = google.maps.LatLng
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import MouseEvent = google.maps.MouseEvent

@Injectable()
export class AngularGoogleMapsBuilder {

    private map: Map
    private marker: Marker
    private circle: Circle

    constructor(private googleMaps: GoogleMapsFactory,
                private geocoder: AngularGoogleMapsGeocoder,
                private eventPublisher: EventPublisher) {
    }

    createMap(mapOptions: MapOptions) {
        this.map = this.googleMaps.createMap(mapOptions)
        return this
    }

    addMarker(markerOptions: MarkerOptions) {
        this.marker = this.googleMaps.createMarker(markerOptions)
        this.marker.setPosition(this.map.getCenter())
        this.marker.setMap(this.map)
        this.addMarkerListeners()
        return this
    }

    addCircle(circleOptions: CircleOptions) {
        this.circle = this.googleMaps.createCircle(circleOptions)
        this.circle.setMap(this.map)
        this.circle.addListener('radius_changed', () => {
            const location = new Location(this.getExistingCoordinates(), this.circle.getRadius())
            this.eventPublisher.notify('locationChanged', location)
        })
        return this
    }

    bindCircleToMarker() {
        this.circle.bindTo('center', this.marker, 'position')
        return this
    }

    hideMarker() {
        this.marker.setMap(null)
        return this
    }

    hideCircle() {
        this.circle.setMap(null)
        return this
    }

    addSearchBox() {
        const box = this.googleMaps.createSearchBox()

        box.addListener('places_changed', () => {
            const places = box.getPlaces()
            if (places[0]) {
                this.changeMapLocationAndZoom(places[0].geometry.location)
                this.changeMarkerLocation(places[0].geometry.location)
                const loc = places[0].geometry.location
                const coordinates = new Coordinates(loc.lat(), loc.lng())
                this.eventPublisher.notify('locationChanged', new Location(coordinates, this.circle.getRadius()))
            }
        })
        return this
    }

    private getExistingCoordinates() {
        let coordinates = new Coordinates(0, 0)
        if (this.marker !== undefined)
            coordinates = new Coordinates(this.marker.getPosition().lat(), this.marker.getPosition().lng())
        return coordinates
    }
    private addMarkerListeners() {
        const notifyLocationChange = (e) => {
            const location = new Location(new Coordinates(e.latLng.lat(), e.latLng.lng()), this.circle.getRadius())
            this.eventPublisher.notify('locationChanged', location)
        }
        this.marker.addListener('dragend', notifyLocationChange)
        this.marker.addListener('dragend', mouseEvent => this.reverseGeocode(mouseEvent))
        this.marker.addListener('dblclick', () => { this.hideMarker(); this.hideCircle() })
        this.marker.addListener('dblclick', () => this.eventPublisher.notify('locationDeleted'))
        this.marker.addListener('dblclick', () => this.googleMaps.getSearchBoxInput().value = '')
        this.map.addListener('click', mouseEvent => this.changeMarkerLocation(mouseEvent.latLng))
        this.map.addListener('click', notifyLocationChange)
        this.map.addListener('click', mouseEvent => this.reverseGeocode(mouseEvent))
    }

    private changeMapLocationAndZoom(location: LatLng) {
        this.map.panTo(location)
        this.map.setZoom(15)
    }

    private changeMarkerLocation(location: LatLng) {
        this.circle.setMap(this.map)
        this.marker.setMap(this.map)
        this.marker.setPosition(location)
    }
    private reverseGeocode(e: MouseEvent) {
        this.geocoder.reverseGeocode(new Coordinates(e.latLng.lat(), e.latLng.lng()), (address: string) =>
            this.eventPublisher.notify('addressReverseGeocoded', address)
        )
    }
}
