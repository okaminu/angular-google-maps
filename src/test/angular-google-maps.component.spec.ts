import { TestBed } from '@angular/core/testing'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsGeocoderService } from 'src/service/angular-google-maps-geocoder.service'
import { AngularGoogleMapsComponent } from '../angular-google-maps.component'
import { Location } from '../location'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder'
import { GoogleMapsService } from '../service/google-maps.service'
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsComponent', () => {

    let component: AngularGoogleMapsComponent

    let eventPublisherSpy: SpyObj<EventPublisher>
    let matIconRegistrySpy: SpyObj<MatIconRegistry>
    let domSanitizerSpy: SpyObj<DomSanitizer>
    let googleMapsBuilderSpy: SpyObj<AngularGoogleMapsBuilder>
    let geocoderSpy: SpyObj<AngularGoogleMapsGeocoderService>
    let googleMapsSpy: SpyObj<GoogleMapsService>

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
                    provide: AngularGoogleMapsBuilder,
                    useValue: createSpyObj('AngularGoogleMapsBuilder',
                        ['createMap', 'addMarker', 'addSearchBox', 'addResizeControl', 'build'])
                },
                {
                    provide: AngularGoogleMapsGeocoderService,
                    useValue: createSpyObj('AngularGoogleMapsGeocoderService', ['reverseGeocode'])
                },
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService', ['getGoogleMaps'])
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
        googleMapsBuilderSpy = TestBed.get(AngularGoogleMapsBuilder)
        geocoderSpy = TestBed.get(AngularGoogleMapsGeocoderService)
        googleMapsSpy = TestBed.get(GoogleMapsService)
        googleMapsSpy.getGoogleMaps.and.returnValue(googleMapsStub)

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

    describe('Loading Google Maps', () => {

        beforeEach(() => {
            googleMapsBuilderSpy.createMap.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addMarker.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addSearchBox.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addResizeControl.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.build.and.returnValue(createSpyObj('google.maps.Map', ['']))
        })

        it('builds a map with marker, search box and custom expand control', () => {
            component.ngOnInit()

            component.setUpMap(location, [location])

            expect(googleMapsBuilderSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }), location)
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                position: jasmine.anything()
            }), true)
            expect(googleMapsBuilderSpy.addSearchBox).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addResizeControl).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.build).toHaveBeenCalled()
        })

        it('builds a map without a marked location', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(jasmine.objectContaining({
                position: jasmine.anything()
            }), false)
        })

        it('reverses geocode a location', () => {
            component.ngOnInit()

            component.setUpMap(location, [new Location(0.0, 1.0)])

            expect(geocoderSpy.reverseGeocode).toHaveBeenCalled()
        })

        it('does not reverse geocode when there is no location', () => {
            component.ngOnInit()

            component.setUpMap(location, [])

            expect(geocoderSpy.reverseGeocode).not.toHaveBeenCalled()
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