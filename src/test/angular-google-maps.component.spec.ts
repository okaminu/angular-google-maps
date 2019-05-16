import { TestBed } from '@angular/core/testing'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsComponent } from '../angular-google-maps.component'
import { Location } from '../location'
import { AngularGoogleMapsListenerService } from '../service/angular-google-maps-listener.service'
import { AngularGoogleMapsService } from '../service/angular-google-maps.service'
import { GoogleMapsService } from '../service/google-maps.service'
import Marker = google.maps.Marker
import SearchBox = google.maps.places.SearchBox
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsComponent', () => {

    let component: AngularGoogleMapsComponent

    let eventPublisherSpy: SpyObj<EventPublisher>
    let matIconRegistrySpy: SpyObj<MatIconRegistry>
    let domSanitizerSpy: SpyObj<DomSanitizer>
    let angularGoogleMapsServiceSpy: SpyObj<AngularGoogleMapsService>
    let googleMapsServiceSpy: SpyObj<GoogleMapsService>
    let googleMapsListenerServiceSpy: SpyObj<AngularGoogleMapsListenerService>

    const subscribers = new Map<string, Function>()
    const location = new Location(10, 20)
    const googleMapsStub = {
        Animation: {DROP: ''},
        ControlPosition: {LEFT_BOTTOM: 'position'}
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AngularGoogleMapsComponent,
                {
                    provide: AngularGoogleMapsService,
                    useValue: createSpyObj('AngularGoogleMapsService',
                        ['createSearchBox', 'reverseGeocode', 'addResizeControl'])
                },
                {
                    provide: AngularGoogleMapsListenerService,
                    useValue: createSpyObj('AngularGoogleMapsListenerService',
                        ['getLocationChangedHandler', 'getBindMarkerToMapHandler',
                            'getLocationChangedSearchBoxMapMarkerHandler', 'getLocationDeletedMarkerHandler'])
                },
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService', ['getGoogleMaps', 'createMap', 'createMarker'])
                },
                {
                    provide: EventPublisher,
                    useValue: createSpyObj('EvenPublisher', ['subscribe', 'notify', 'unsubscribe'])
                },
                {provide: MatIconRegistry, useValue: createSpyObj('MatIconRegistry', ['addSvgIcon'])},
                {provide: DomSanitizer, useValue: createSpyObj('DomSanitizer', ['bypassSecurityTrustResourceUrl'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        eventPublisherSpy.subscribe.and.callFake((e, fun) => subscribers.set(e, fun))
        matIconRegistrySpy = TestBed.get(MatIconRegistry)
        domSanitizerSpy = TestBed.get(DomSanitizer)
        angularGoogleMapsServiceSpy = TestBed.get(AngularGoogleMapsService)
        googleMapsServiceSpy = TestBed.get(GoogleMapsService)
        googleMapsServiceSpy.getGoogleMaps.and.returnValue(googleMapsStub)
        googleMapsListenerServiceSpy = TestBed.get(AngularGoogleMapsListenerService)

        component = TestBed.get(AngularGoogleMapsComponent)
    })

    it('registers an icon', () => {
        const safeResource = createSpyObj('SafeResourceUrl', [''])
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue(safeResource)

        component.ngOnInit()

        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledWith(jasmine.any(String), safeResource)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalled()
        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledTimes(2)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalledTimes(2)
    })

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy()

        expect(eventPublisherSpy.unsubscribe).toHaveBeenCalledWith('addressReverseGeocoded')
    })

    describe('Loaded Google Maps', () => {

        let mapSpy: SpyObj<google.maps.Map>
        let markerSpy: SpyObj<Marker>
        let searchBoxSpy: SpyObj<SearchBox>
        let handlerDummy: SpyObj<() => void>

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['getCenter', 'addListener'])
            markerSpy = createSpyObj('google.maps.Marker', ['addListener'])
            searchBoxSpy = createSpyObj('google.maps.places.SearchBox', ['addListener'])
            handlerDummy = createSpyObj('ListenerHandler', [''])

            googleMapsServiceSpy.createMap.and.returnValue(mapSpy)
            googleMapsServiceSpy.createMarker.and.returnValue(markerSpy)
            angularGoogleMapsServiceSpy.createSearchBox.and.returnValue(searchBoxSpy)
        })

        it('creates a map', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(googleMapsServiceSpy.createMap).toHaveBeenCalled()
        })

        it('creates a map with a search box', () => {
            googleMapsListenerServiceSpy.getLocationChangedSearchBoxMapMarkerHandler.and.returnValue(handlerDummy)
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(angularGoogleMapsServiceSpy.createSearchBox).toHaveBeenCalledWith(mapSpy)
            expect(searchBoxSpy.addListener).toHaveBeenCalledWith('places_changed', handlerDummy)
            expect(googleMapsListenerServiceSpy.getLocationChangedSearchBoxMapMarkerHandler)
                .toHaveBeenCalledWith(searchBoxSpy, mapSpy, markerSpy)
        })

        it('creates a map with a configured marked', () => {
            googleMapsListenerServiceSpy.getLocationChangedHandler.and.returnValue(handlerDummy)
            googleMapsListenerServiceSpy.getBindMarkerToMapHandler.and.returnValue(handlerDummy)
            googleMapsListenerServiceSpy.getLocationDeletedMarkerHandler.and.returnValue(handlerDummy)
            component.ngOnInit()

            component.setUpMap(location, [new Location(0.0, 1.0)])

            expect(googleMapsServiceSpy.createMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                map: jasmine.anything()
            }))
            expect(markerSpy.addListener).toHaveBeenCalledWith('dragend', handlerDummy)
            expect(markerSpy.addListener).toHaveBeenCalledWith('dblclick', handlerDummy)
            expect(mapSpy.addListener).toHaveBeenCalledWith('click', handlerDummy)
            expect(googleMapsListenerServiceSpy.getLocationChangedHandler).toHaveBeenCalled()
            expect(googleMapsListenerServiceSpy.getLocationDeletedMarkerHandler).toHaveBeenCalledWith(markerSpy)
            expect(googleMapsListenerServiceSpy.getBindMarkerToMapHandler).toHaveBeenCalledWith(markerSpy, mapSpy)
        })

        it('creates a map without a marked location', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(googleMapsServiceSpy.createMarker).toHaveBeenCalled()
            expect(googleMapsServiceSpy.createMarker).not.toHaveBeenCalledWith(jasmine.objectContaining({
                map: jasmine.anything()
            }))
        })

        it('creates a map with multiple map type buttons', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(googleMapsServiceSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }))
        })

        it('reverses geocode a location', () => {
            component.ngOnInit()

            component.setUpMap(location, [new Location(0.0, 1.0)])

            expect(angularGoogleMapsServiceSpy.reverseGeocode).toHaveBeenCalled()
        })

        it('does not reverse geocode when there is no location', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(angularGoogleMapsServiceSpy.reverseGeocode).not.toHaveBeenCalled()
        })

        it('adds resize control', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(angularGoogleMapsServiceSpy.addResizeControl).toHaveBeenCalled()
        })

    })

    it('sets address from broadcast event', () => {
        const address = 'Some address'
        component.ngOnInit()

        subscribers.get('addressReverseGeocoded')(address)

        expect(component.address).toEqual(address)
    })

    describe('Custom resizing of Google Maps', () => {

        it('publishes an event', () => {
            component.ngOnInit()

            component.onMapResize()

            expect(eventPublisherSpy.notify).toHaveBeenCalled()
        })

        it('sets resize state to expanded', () => {
            component.ngOnInit()

            component.onMapResize()

            expect(component.isMapExpanded).toBeTruthy()
        })

        it('sets resize state to collapsed', () => {
            component.ngOnInit()

            component.onMapResize()
            component.onMapResize()

            expect(component.isMapExpanded).toBeFalsy()
        })
    })

})