import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
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
    private markerCircle: Circle

    constructor(private googleMaps: GoogleMapsFactory,
                private geocoder: AngularGoogleMapsGeocoder,
                private eventPublisher: EventPublisher) {
    }

    createMap(mapOptions: MapOptions) {
        this.map = this.googleMaps.createMap(mapOptions)
        return this
    }

    addMarkerWithCircle(markerOptions: MarkerOptions, circleOptions: CircleOptions) {
        this.createMarker(markerOptions)
        this.createCircle(circleOptions)
        this.markerCircle.bindTo('center', this.marker, 'position')
        return this
    }

    hideMarkerWithCircle() {
        this.marker.setMap(null)
        this.markerCircle.setMap(null)
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
                this.eventPublisher.notify('locationChanged', new Location(loc.lat(), loc.lng()))
            }
        })

        return this
    }

    private createCircle(circleOptions: CircleOptions) {
        this.markerCircle = this.googleMaps.createCircle(circleOptions)
        this.markerCircle.setMap(this.map)
    }

    private createMarker(markerOptions: google.maps.MarkerOptions) {
        this.marker = this.googleMaps.createMarker(markerOptions)
        this.marker.setPosition(this.map.getCenter())
        this.marker.setMap(this.map)
        this.addMarkerListeners()
    }

    private addMarkerListeners() {
        this.marker.addListener('dragend', mouseEvent => this.notifyLocationChange(mouseEvent))
        this.marker.addListener('dragend', mouseEvent => this.reverseGeocode(mouseEvent))
        this.marker.addListener('dblclick', () => this.hideMarkerWithCircle())
        this.marker.addListener('dblclick', () => this.eventPublisher.notify('locationDeleted'))
        this.marker.addListener('dblclick', () => this.googleMaps.getSearchBoxInput().value = '')
        this.map.addListener('click', mouseEvent => this.changeMarkerLocation(mouseEvent.latLng))
        this.map.addListener('click', mouseEvent => this.notifyLocationChange(mouseEvent))
        this.map.addListener('click', mouseEvent => this.reverseGeocode(mouseEvent))
    }

    private changeMapLocationAndZoom(location: LatLng) {
        this.map.panTo(location)
        this.map.setZoom(15)
    }

    private changeMarkerLocation(location: LatLng) {
        this.markerCircle.setMap(this.map)
        this.marker.setMap(this.map)
        this.marker.setPosition(location)
    }

    private notifyLocationChange(e: MouseEvent) {
        this.eventPublisher.notify('locationChanged', new Location(e.latLng.lat(), e.latLng.lng()))
    }

    private reverseGeocode(e: MouseEvent) {
        this.geocoder.reverseGeocode(new Location(e.latLng.lat(), e.latLng.lng()), (address: string) =>
            this.eventPublisher.notify('addressReverseGeocoded', address)
        )
    }
}
