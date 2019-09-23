import { Injectable } from '@angular/core'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
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
                private eventPublisher: EventPublisher,
                private iconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer) {
    }

    createMap(mapOptions: MapOptions) {
        this.map = this.googleMaps.createMap(mapOptions)
        const person = {
            url: 'http://cdn.boldadmin.com.s3-website-eu-west-1.amazonaws.com/person.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(20, 33),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(10, 23)
        }

        const flag = {
            url: 'http://cdn.boldadmin.com.s3-website-eu-west-1.amazonaws.com/flag.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(20, 20),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(0, 20)
        }

        const flightPlanCoordinates = [
            {lat: 54.7032843540163, lng: 25.2913247925164},
            {lat: 54.7011951570853, lng: 25.3239404541375},
            {lat: 54.7162923278114, lng: 25.3202006080902}
        ]

        flightPlanCoordinates.forEach((value, index) => {
            let icon = flag

            if (index === 2) {
                icon = person
            }
            const marker = new google.maps.Marker({
                position: value,
                map: this.map,
                icon: icon,
                shape: {
                    coords: [1, 1, 1, 20, 18, 20, 18, 1],
                    type: 'poly'
                },
                title: 'Cia buvo Aurimas'
            })
        })

        const flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 0.3,
            strokeWeight: 2,
            icons: [{
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                },
                offset: '100%'
            }]
        })
        flightPath.setMap(this.map)
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
        this.circle.addListener('radius_changed', () => this.notifyLocationChange())
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

    private addMarkerListeners() {
        this.marker.addListener('dragend', () => this.notifyLocationChange())
        this.marker.addListener('dragend', mouseEvent => this.reverseGeocode(mouseEvent))
        this.marker.addListener('dblclick', () => { this.hideMarker(); this.hideCircle() })
        this.marker.addListener('dblclick', () => this.eventPublisher.notify('locationDeleted'))
        this.marker.addListener('dblclick', () => this.googleMaps.getSearchBoxInput().value = '')
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
