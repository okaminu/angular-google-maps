import { Component, OnDestroy, OnInit, Output } from '@angular/core'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from './location'
import { mapsText } from './angular-google-maps.constant'
import { AngularGoogleMapsBuilder } from './service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from './service/angular-google-maps-geocoder.service'
import { GoogleMapsService } from './service/google-maps.service'
import MapOptions = google.maps.MapOptions
import MarkerOptions = google.maps.MarkerOptions

@Component({
    selector: 'google-maps',
    template: `
        <input id="search-input" name="searchBox" class="controls" type="text"
               placeholder="{{mapsText.searchBox}}"
               [ngModelOptions]="{standalone: true}"
               [(ngModel)]="address"/>
        <mat-icon id="resize-control" matSuffix
                  svgIcon="{{!isMapExpanded ? 'expand' : 'collapse'}}"
                  (click)="resizeMap()"></mat-icon>
        
        <div id="map"></div>`
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
                private googleMapsBuilder: AngularGoogleMapsBuilder,
                private googleMapsGeocoder: AngularGoogleMapsGeocoder,
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
        this.eventPublisher.unsubscribeAll('addressReverseGeocoded')
    }

    setUpMapByLocation(focusLocation: Location) {
        this.googleMapsGeocoder.reverseGeocode(focusLocation)

        this.googleMapsBuilder
            .createMap(this.mapOptions, focusLocation)
            .addMarker(this.markerOptions, true)
            .addSearchBox()
            .build()
    }

    setUpMapByAddress(address: string) {
        this.googleMapsGeocoder.geocode(address, (location: Location) =>
            this.googleMapsBuilder
                .createMap(this.mapOptions, location)
                .addMarker(this.markerOptions, false)
                .addSearchBox()
                .build())
    }

    resizeMap() {
        this.isMapExpanded = !this.isMapExpanded
        if (this.isMapExpanded)
            this.eventPublisher.notify('googleMapsExpanded')
        else
            this.eventPublisher.notify('googleMapsCollapsed')
    }
}
