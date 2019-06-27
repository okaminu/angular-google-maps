import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsComponent } from '../angular-google-maps.component'
import { Coordinates } from '../coordinates'
import { Location } from '../location'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from '../service/google-maps-factory.service'
import { IconRegistry } from '../service/icon-registry/icon-registry'
import any = jasmine.any
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsComponent', () => {

    let component: AngularGoogleMapsComponent

    let eventPublisherSpy: SpyObj<EventPublisher>
    let iconRegistrySpy: SpyObj<IconRegistry>
    let googleMapsBuilderSpy: SpyObj<AngularGoogleMapsBuilder>
    let geocoderSpy: SpyObj<AngularGoogleMapsGeocoder>
    let googleMapsFactory: SpyObj<GoogleMapsFactory>

    const subscribers = new Map<string, Function>()
    const location = new Location(new Coordinates(10, 20), 70)
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
                        [
                            'createMap',
                            'addMarker',
                            'addCircle',
                            'hideMarker',
                            'hideCircle',
                            'bindCircleToMarker',
                            'addSearchBox',
                            'build'
                        ]
                    )
                },
                {
                    provide: AngularGoogleMapsGeocoder,
                    useValue: createSpyObj('AngularGoogleMapsGeocoder', ['reverseGeocode', 'geocode'])
                },
                {
                    provide: GoogleMapsFactory,
                    useValue: createSpyObj('GoogleMapsFactory', ['getGoogleMaps'])
                },
                {
                    provide: EventPublisher,
                    useValue: createSpyObj('EvenPublisher', ['subscribe', 'notify', 'unsubscribeAll'])
                },
                {provide: IconRegistry, useValue: createSpyObj('IconRegistry', ['register'])},
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        eventPublisherSpy.subscribe.and.callFake((e, fun) => subscribers.set(e, fun))
        googleMapsBuilderSpy = TestBed.get(AngularGoogleMapsBuilder)
        geocoderSpy = TestBed.get(AngularGoogleMapsGeocoder)
        googleMapsFactory = TestBed.get(GoogleMapsFactory)
        googleMapsFactory.getGoogleMaps.and.returnValue(googleMapsStub)

        component = TestBed.get(AngularGoogleMapsComponent)
    })

    it('registers an icon', () => {
        iconRegistrySpy = TestBed.get(IconRegistry)

        component.ngOnInit()

        expect(iconRegistrySpy.register).toHaveBeenCalledTimes(2)
    })

    it('subscribes setup functions', () => {
        component.ngOnInit()

        expect(eventPublisherSpy.subscribe).toHaveBeenCalledWith('addressReverseGeocoded', any(Function))
    })

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy()

        expect(eventPublisherSpy.unsubscribeAll).toHaveBeenCalledWith('addressReverseGeocoded')
    })

    describe('Loading Google Maps', () => {

        beforeEach(() => {
            googleMapsBuilderSpy.createMap.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addMarker.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addCircle.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.bindCircleToMarker.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.hideCircle.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.hideMarker.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addSearchBox.and.returnValue(googleMapsBuilderSpy)
        })

        it('builds a map with marker and search box', () => {
            component.ngOnInit()

            component.createMapByLocation(location)

            expect(googleMapsBuilderSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    center: {
                        lat: location.coordinates.latitude,
                        lng: location.coordinates.longitude
                    },
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }))
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addCircle).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.bindCircleToMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addSearchBox).toHaveBeenCalled()
        })

        it('reverse geocodes coordinates', () => {
            geocoderSpy.reverseGeocode.and.callFake((request, callback: any) =>
                callback('address')
            )
            component.ngOnInit()

            component.createMapByLocation(location)

            expect(geocoderSpy.reverseGeocode).toHaveBeenCalledWith(location.coordinates, any(Function))
            expect(component.address).toEqual('address')
        })

        it('builds a map by address', () => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback(location.coordinates)
            )
            component.ngOnInit()

            component.createMapByAddress('address')

            expect(googleMapsBuilderSpy.createMap).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    center: {
                        lat: location.coordinates.latitude,
                        lng: location.coordinates.longitude
                    },
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite'],
                        position: 'position'
                    }
                }))
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addCircle).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.bindCircleToMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.hideMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.hideCircle).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addSearchBox).toHaveBeenCalled()
        })

    })

    it('sets address from broadcast event', () => {
        const address = 'Some address'
        component.ngOnInit()

        subscribers.get('addressReverseGeocoded')(address)

        expect(component.address).toEqual(address)
    })

    describe('Resizes Google Maps', () => {

        it('expands map', () => {
            component.ngOnInit()

            component.resizeMap()

            expect(component.isMapExpanded).toBeTruthy()
            expect(eventPublisherSpy.notify).toHaveBeenCalledWith('googleMapsExpanded')
        })

        it('collapses map', () => {
            component.ngOnInit()

            component.resizeMap()
            component.resizeMap()

            expect(component.isMapExpanded).toBeFalsy()
            expect(eventPublisherSpy.notify).toHaveBeenCalledWith('googleMapsCollapsed')
        })
    })

})