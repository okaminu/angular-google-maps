import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import * as moment from 'moment'
import { mapsText } from './angular-google-maps.constant'
import { AngularGoogleMapsBuilder } from './service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from './service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from './service/google-maps-factory.service'
import { IconRegistry } from './service/icon-registry/icon-registry'
import { Coordinates } from './value-object/coordinates'
import { Location } from './value-object/location'
import { TimestampCoordinates } from './value-object/timestamp-coordinates'
import CircleOptions = google.maps.CircleOptions
import Icon = google.maps.Icon
import LatLng = google.maps.LatLng
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Component({
    selector: 'google-maps',
    templateUrl: './angular-google-maps.html',
    providers: [AngularGoogleMapsBuilder]
})
export class AngularGoogleMapsComponent implements OnInit, OnDestroy {

    mapsText = mapsText
    address = ''
    isMapExpanded = false

    @Output() mapOptions: MapOptions = {
        center: {
            lat: 0,
            lng: 0
        },
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite'],
            position: this.googleMapsFactory.getGoogleMaps().ControlPosition.LEFT_BOTTOM
        },
        zoom: 10,
        controlSize: 22,
        fullscreenControl: false
    }

    @Output() markerOptions: MarkerOptions = {
        position: {
            lat: 0,
            lng: 0
        },
        draggable: true,
        animation: this.googleMapsFactory.getGoogleMaps().Animation.DROP
    }

    @Output() circleOptions: CircleOptions = {
        strokeColor: '#448aff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#448aff',
        fillOpacity: 0.35,
        editable: true,
        radius: 70
    }

    @Output() previousMarkerIcon: Icon = {
        url: 'http://cdn.boldadmin.com.s3-website-eu-west-1.amazonaws.com/previous-marker.png'
    }

    @Output() currentMarkerIcon: Icon = {
        url: 'http://cdn.boldadmin.com.s3-website-eu-west-1.amazonaws.com/current-marker.png'
    }

    constructor(private googleMapsFactory: GoogleMapsFactory,
                private googleMapsBuilder: AngularGoogleMapsBuilder,
                private googleMapsGeocoder: AngularGoogleMapsGeocoder,
                private eventPublisher: EventPublisher,
                private iconRegistry: IconRegistry) {
    }

    ngOnInit() {
        this.eventPublisher.subscribe('addressReverseGeocoded', (address: string) => this.address = address)
        this.iconRegistry.register('expand', './assets/expand.svg')
        this.iconRegistry.register('collapse', './assets/collapse.svg')
    }

    ngOnDestroy() {
        this.eventPublisher.unsubscribeAll('addressReverseGeocoded')
    }

    createMapByLocation(focusLocation: Location) {
        this.googleMapsGeocoder.reverseGeocode(focusLocation.coordinates, (address: string) => this.address = address)
        this.circleOptions.radius = focusLocation.radiusInMeters
        this.changeMapCenter(focusLocation.coordinates)
        this.googleMapsBuilder
            .createMap(this.mapOptions)
            .addCenterMarker(this.markerOptions)
            .addCircle(this.circleOptions)
            .bindCircleToMarker()
            .addSearchBox()
    }

    createMapByAddress(address: string) {
        this.googleMapsGeocoder.geocode(address, (coordinates: Coordinates) => {
                this.changeMapCenter(coordinates)
                this.googleMapsBuilder
                    .createMap(this.mapOptions)
                    .addCenterMarker(this.markerOptions)
                    .addCircle(this.circleOptions)
                    .bindCircleToMarker()
                    .hideMarker()
                    .hideCircle()
                    .addSearchBox()
            }
        )
    }

    resizeMap() {
        this.isMapExpanded = !this.isMapExpanded
        if (this.isMapExpanded)
            this.eventPublisher.notify('googleMapsExpanded')
        else
            this.eventPublisher.notify('googleMapsCollapsed')
    }

    addTravelPath(timestampCoordinatesList: Array<TimestampCoordinates>, name: string) {
        timestampCoordinatesList.forEach((timestampCoordinates: TimestampCoordinates, index: number) => {
            const icon = index === 0 ? this.currentMarkerIcon : this.previousMarkerIcon
            const dateTime = moment.utc(timestampCoordinates.timestamp).format('YYYY.MM.DD HH:mm')
            this.googleMapsBuilder.addMarker({
                position: this.googleMapsFactory.createLatLng(timestampCoordinates.coordinates),
                title: `Name: ${name}, Time: ${dateTime}`,
                icon: icon
            })
        })

        const latLngs = timestampCoordinatesList.map(value => this.googleMapsFactory.createLatLng(value.coordinates))
        this.addPolyline(latLngs, '#' + Math.random().toString(16).substr(2, 6))
    }

    private addPolyline(path: Array<LatLng>, colorCode: string) {
        this.googleMapsBuilder.addPolyline({
            geodesic: true,
            strokeOpacity: 0.8,
            strokeWeight: 1,
            path: path,
            strokeColor: colorCode
        })
    }

    private changeMapCenter(coordinates: Coordinates) {
        this.mapOptions.center = {lat: coordinates.latitude, lng: coordinates.longitude}
    }
}
