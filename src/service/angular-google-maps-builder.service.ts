import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Coordinates } from '../value-object/coordinates'
import { Location } from '../value-object/location'
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
import PolylineOptions = google.maps.PolylineOptions


@Injectable()
export class AngularGoogleMapsBuilder {

    private map: Map
    private marker: Marker
    private circle: Circle

    constructor(private googleMapsFactory: GoogleMapsFactory,
                private geocoder: AngularGoogleMapsGeocoder,
                private eventPublisher: EventPublisher
    ) {}

    createMap(mapOptions: MapOptions) {
        this.map = this.googleMapsFactory.createMap(mapOptions)

        return this
    }

    addCenterMarker(markerOptions: MarkerOptions) {
        this.marker = this.googleMapsFactory.createMarker(markerOptions)
        this.marker.setPosition(this.map.getCenter())
        this.marker.setMap(this.map)
        this.addMarkerListeners()
        return this
    }

    addCircle(circleOptions: CircleOptions) {
        this.circle = this.googleMapsFactory.createCircle(circleOptions)
        this.circle.setMap(this.map)
        this.circle.addListener('radius_changed', () => this.notifyLocationChange())
        return this
    }

    addPolyline(polylineOptions: PolylineOptions) {
        const polyline = this.googleMapsFactory.createPolyline(polylineOptions)
        polyline.setMap(this.map)
        return this
    }

    addMarker(markerOptions: MarkerOptions) {
        const marker = this.googleMapsFactory.createMarker(markerOptions)
        marker.setMap(this.map)
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
        const box = this.googleMapsFactory.createSearchBox()

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

    private addMarkerListeners() {
        this.marker.addListener('dragend', () => this.notifyLocationChange())
        this.marker.addListener('dragend', mouseEvent => this.reverseGeocode(mouseEvent))
        this.map.addListener('click', mouseEvent => this.changeMarkerLocation(mouseEvent.latLng))
        this.map.addListener('click', () => this.notifyLocationChange())
        this.map.addListener('click', mouseEvent => this.reverseGeocode(mouseEvent))
    }

    private notifyLocationChange() {
        this.eventPublisher.notify('locationChanged', new Location(this.getCoordinates(), this.getRadius()))
    }

    private getRadius() {
        let radiusInMeters = 0
        if (this.circle !== undefined)
            radiusInMeters = this.circle.getRadius()

        return radiusInMeters
    }

    private getCoordinates() {
        let coordinates = new Coordinates(0, 0)
        if (this.marker !== undefined)
            coordinates = new Coordinates(this.marker.getPosition().lat(), this.marker.getPosition().lng())

        return coordinates
    }

    private changeMapLocationAndZoom(location: LatLng) {
        this.map.panTo(location)
        this.map.setZoom(16)
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
