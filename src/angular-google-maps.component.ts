import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from './location'
import { AngularGoogleMapsGeocoderService } from './service/angular-google-maps-geocoder.service'
import { AngularGoogleMapsListenerService } from './service/angular-google-maps-listener.service'
import { AngularGoogleMapsService } from './service/angular-google-maps.service'
import { GoogleMapsService } from './service/google-maps.service'
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
            position: this.googleMaps.getGoogleMaps().ControlPosition.LEFT_BOTTOM
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
        animation: this.googleMaps.getGoogleMaps().Animation.DROP
    }

    constructor(private googleMaps: GoogleMapsService,
                private googleMapsService: AngularGoogleMapsService,
                private googleMapsGeocoderService: AngularGoogleMapsGeocoderService,
                private googleMapsListeners: AngularGoogleMapsListenerService,
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
        const areMarkerLocationsProvided = markerLocations.length > 0

        if (areMarkerLocationsProvided)
            this.googleMapsGeocoderService.reverseGeocode(focusLocation)

        this.googleMapsService
            .createMap(this.mapOptions, focusLocation)
            .addMarker(this.markerOptions, areMarkerLocationsProvided)
            .addSearchBox()
            .addResizeControl()
            .build()
    }

    onMapResize() {
        this.eventPublisher.notify('onGoogleMapResize')
        this.isMapExpanded = !this.isMapExpanded
    }

}
