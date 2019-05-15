import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { GoogleMapsSingleton } from './google-maps-singleton.service'
import { Location } from './location'
import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Component({
    selector: 'google-maps',
    template: `
        <input id="search-input" name="searchBox" class="controls" type="text"
               placeholder="Search Box"
               [ngModelOptions]="{standalone: true}"
               [(ngModel)]="address"/>
        <div id="map"></div>
        <mat-icon id="resize-control" matSuffix
                  svgIcon="{{!isMapExpanded ? 'expand' : 'collapse'}}"
                  (click)="onMapResize()"></mat-icon>`
})
export class AngularGoogleMapsComponent implements OnInit, OnDestroy {

    address = ''
    isMapExpanded = false

    @Output() mapOptions: MapOptions = {
        center: {
            lat: 0,
            lng: 0
        },
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite'],
            position: this.googleMaps.singleton.ControlPosition.LEFT_BOTTOM
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
        animation: this.googleMaps.singleton.Animation.DROP
    }

    constructor(private googleMaps: GoogleMapsSingleton,
                private googleMapsService: AngularGoogleMapsService,
                private eventPublisher: EventPublisher,
                private iconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.eventPublisher.subscribe('addressReverseGeocoded', (address: string) => this.address = address)
        this.iconRegistry.addSvgIcon('expand', this.sanitizer.bypassSecurityTrustResourceUrl('./assets/expand.svg'))
        this.iconRegistry.addSvgIcon('collapse', this.sanitizer.bypassSecurityTrustResourceUrl('./assets/collapse.svg'))

    }

    ngOnDestroy() {
        this.eventPublisher.unsubscribe('addressReverseGeocoded')
    }

    setUpMap(focusLocation: Location, markerLocations: Array<Location>) {
        let map: Map
        const areMarkerLocationsProvided = markerLocations.length > 0

        if (areMarkerLocationsProvided)
            this.googleMapsService.reverseGeocode(focusLocation)
        this.createMap(focusLocation)
            .then(mapPromise => {
                map = mapPromise
                this.bindMarkerToMapsIfLocationIsProvided(map, areMarkerLocationsProvided)
                return this.googleMapsService.addMarker(this.markerOptions)
            })
            .then(markerPromise => {
                this.googleMapsService.bindMarkerToMapClick(markerPromise, map)
                this.googleMapsService.addSearchBox(map, markerPromise)
                this.googleMapsService.addResizeControl(map)
            })
    }

    onMapResize() {
        this.eventPublisher.notify('onGoogleMapResize')
        this.isMapExpanded = !this.isMapExpanded
    }

    private createMap(focusLocation: Location) {
        this.mapOptions.center = {
            lat: focusLocation.latitude,
            lng: focusLocation.longitude
        }
        return this.googleMapsService.createMap(this.mapOptions)
    }

    private bindMarkerToMapsIfLocationIsProvided(map: Map, isLocationProvided: boolean) {
        this.markerOptions.position = map.getCenter()
        if (isLocationProvided)
            this.markerOptions.map = map
    }

}
