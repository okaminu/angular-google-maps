import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { GoogleMapsSingleton } from './google-maps-singleton.service'
import { Location } from './location'
import { MatIconRegistry } from '@angular/material'

describe('AngularGoogleMaps Component: ', () => {

    let component: AngularGoogleMapsComponent

    let eventPublisherSpy: SpyObj<EventPublisher>
    let matIconRegistrySpy: SpyObj<MatIconRegistry>
    let domSanitizerSpy: SpyObj<DomSanitizer>
    let googleMapsSingletonStub: SpyObj<GoogleMapsSingleton>
    let googleMapsServiceSpy: SpyObj<AngularGoogleMapsService>

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
                        ['createMap', 'addMarker', 'addSearchBox', 'reverseGeocode', 'bindMarkerToMapClick',
                            'addResizeControl', 'initGoogleMaps'])
                },
                {provide: GoogleMapsSingleton, useValue: createSpyObj('GoogleMapsSingleton', [])},
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
        googleMapsSingletonStub = TestBed.get(GoogleMapsSingleton)
        googleMapsSingletonStub.singleton = googleMapsStub
        googleMapsServiceSpy = TestBed.get(AngularGoogleMapsService)

        component = TestBed.get(AngularGoogleMapsComponent)
    })

    it('Registers icons', () => {
        const safeResource = createSpyObj('SafeResourceUrl', [''])
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue(safeResource)

        component.ngOnInit()

        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledWith(jasmine.any(String), safeResource)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalled()
        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledTimes(2)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalledTimes(2)
    })

    it('Unsubscribes on destroy', () => {
        component.ngOnDestroy()

        expect(eventPublisherSpy.unsubscribe).toHaveBeenCalledWith('addressReverseGeocoded')
    })

    describe('Loading Google Maps: ', () => {

        let mapSpy: SpyObj<google.maps.Map>
        let markerSpy: SpyObj<google.maps.Marker>

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['getCenter'])
            markerSpy = createSpyObj('google.maps.Marker', [''])

            googleMapsServiceSpy.createMap.and.returnValue(Promise.resolve(mapSpy))
            googleMapsServiceSpy.addMarker.and.returnValue(Promise.resolve(markerSpy))
        })

        it('Creates a map with a marker and searchBox', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [])
            tick()

            expect(googleMapsServiceSpy.createMap).toHaveBeenCalled()
            expect(googleMapsServiceSpy.addMarker).toHaveBeenCalled()
            expect(googleMapsServiceSpy.bindMarkerToMapClick).toHaveBeenCalled()
            expect(googleMapsServiceSpy.addSearchBox).toHaveBeenCalled()
        }))

        it('Creates a map with a marked location', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [new Location(0.0, 1.0)])
            tick()

            expect(googleMapsServiceSpy.addMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                map: jasmine.anything()
            }))
        }))

        it('Creates a map without a marked location', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [])
            tick()

            expect(googleMapsServiceSpy.addMarker).toHaveBeenCalled()
            expect(googleMapsServiceSpy.addMarker).not.toHaveBeenCalledWith(jasmine.objectContaining({
                map: jasmine.anything()
            }))
        }))

        it('Creates a map with multiple map types', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [])
            tick()

            expect(googleMapsServiceSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }))
        }))

        it('Reverse geocodes location', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [new Location(0.0, 1.0)])
            tick()

            expect(googleMapsServiceSpy.reverseGeocode).toHaveBeenCalled()
        }))

        it('Does not reverse geocode when there is no location', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [])
            tick()

            expect(googleMapsServiceSpy.reverseGeocode).not.toHaveBeenCalled()
        }))

        it('Adds resize control', fakeAsync(() => {
            component.ngOnInit()

            component.setUpMap(location, [])
            tick()

            expect(googleMapsServiceSpy.addResizeControl).toHaveBeenCalled()
        }))

    })

    it('Sets address from broadcast event', () => {
        const address = 'Some address'
        component.ngOnInit()

        subscribers.get('addressReverseGeocoded')(address)

        expect(component.address).toEqual(address)
    })

    describe('Custom resizing Google Maps: ', () => {

        it('Publishes event on map resize', () => {
            component.ngOnInit()

            component.onMapResize()

            expect(eventPublisherSpy.notify).toHaveBeenCalled()
        })

        it('Sets resize state to expanded', () => {
            component.ngOnInit()

            component.onMapResize()

            expect(component.isMapExpanded).toBeTruthy()
        })

        it('Sets resize state to collapsed', () => {
            component.ngOnInit()

            component.onMapResize()
            component.onMapResize()

            expect(component.isMapExpanded).toBeFalsy()
        })
    })

})