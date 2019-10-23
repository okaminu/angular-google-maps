import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsComponent } from '../angular-google-maps.component'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from '../service/google-maps-factory.service'
import { IconRegistry } from '../service/icon-registry/icon-registry'
import { Coordinates } from '../value-object/coordinates'
import { Location } from '../value-object/location'
import { TimestampCoordinates } from '../value-object/timestamp-coordinates'
import LatLng = google.maps.LatLng
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
                        ['createMap', 'addCenterMarker', 'addCircle', 'hideMarker', 'hideCircle', 'bindCircleToMarker',
                            'addSearchBox', 'build', 'addMarker', 'addPolyline']
                    )
                },
                {
                    provide: AngularGoogleMapsGeocoder,
                    useValue: createSpyObj('AngularGoogleMapsGeocoder', ['reverseGeocode', 'geocode'])
                },
                {
                    provide: GoogleMapsFactory,
                    useValue: createSpyObj(
                        'GoogleMapsFactory',
                        ['getGoogleMaps', 'createSize', 'createPoint', 'createLatLng']
                    )
                },
                {
                    provide: EventPublisher,
                    useValue: createSpyObj('EvenPublisher', ['subscribe', 'notify', 'unsubscribeAll'])
                },
                {provide: IconRegistry, useValue: createSpyObj('IconRegistry', ['register'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
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

    it('subscribes on init', () => {
        component.ngOnInit()

        expect(eventPublisherSpy.subscribe).toHaveBeenCalledWith('addressReverseGeocoded', jasmine.any(Function))
    })

    it('unsubscribes on destroy', () => {
        component.ngOnInit()

        component.ngOnDestroy()

        expect(eventPublisherSpy.unsubscribeAll).toHaveBeenCalledWith('addressReverseGeocoded')
    })

    describe('Loading Google Maps', () => {

        beforeEach(() => {
            googleMapsBuilderSpy.createMap.and.returnValue(googleMapsBuilderSpy)
            googleMapsBuilderSpy.addCenterMarker.and.returnValue(googleMapsBuilderSpy)
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
            expect(googleMapsBuilderSpy.addCenterMarker).toHaveBeenCalled()
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
            expect(googleMapsBuilderSpy.addCenterMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addCircle).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.bindCircleToMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.hideMarker).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.hideCircle).toHaveBeenCalled()
            expect(googleMapsBuilderSpy.addSearchBox).toHaveBeenCalled()
        })

    })

    it('sets address from broadcast event', () => {
        const address = 'Some address'
        const subscribers = new Map<string, Function>()
        eventPublisherSpy.subscribe.and.callFake((e, fun) => subscribers.set(e, fun))
        component.ngOnInit()

        subscribers.get('addressReverseGeocoded')(address)

        expect(component.address).toEqual(address)
    })

    it('fires map resize event', () => {
        component.notifyMapResize()

        expect(eventPublisherSpy.notify).toHaveBeenCalledWith('resizeMap')
    })

    describe('Travel path', () => {

        const latLng: LatLng = {
            lat: (): number => 1,
            lng: (): number => 2,
            equals : (): boolean => true,
            toUrlValue : (): string => '',
            toJSON : () => ({ lat: 1, lng: 2 }),
        }

        beforeEach(() => {
            component.ngOnInit()
        })

        it('does not add marker when no coordinates are given', () => {
            component.addTravelPath([], '')

            expect(googleMapsBuilderSpy.addMarker).not.toHaveBeenCalled()
        })


        it('adds current icon for last coordinates', () => {
            component.addTravelPath([(new TimestampCoordinates(new Coordinates(1, 2), 0))], '')

            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    icon: component.currentMarkerIcon
                })
            )
        })

        it('adds previous icon for past coordinates', () => {
            const coordinates = new TimestampCoordinates(new Coordinates(1, 2), 0)

            component.addTravelPath([coordinates, coordinates], '')

            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledTimes(2)
            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    icon: component.previousMarkerIcon
                })
            )
        })

        it('adds name and formatted timestamp to title', () => {
            component.addTravelPath([(new TimestampCoordinates(new Coordinates(1, 2), 1234567))], 'john')

            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    title: 'Name: john, Time: 1970.01.01 00:20'
                })
            )
        })

        it('matches given coordinates for marker position', () => {
            googleMapsFactory.createLatLng.withArgs(new Coordinates(1, 2)).and.returnValue(latLng)

            component.addTravelPath([(new TimestampCoordinates(new Coordinates(1, 2), 0))], '')

            expect(googleMapsBuilderSpy.addMarker).toHaveBeenCalledWith(
                jasmine.objectContaining({ position: latLng })
            )
        })

        it('sets polyline for given coordinates', () => {
            googleMapsFactory.createLatLng.withArgs(new Coordinates(1, 1)).and.returnValue(latLng)

            const coordinates = new TimestampCoordinates(new Coordinates(1, 1), 0)
            component.addTravelPath([coordinates, coordinates], '')

            expect(googleMapsBuilderSpy.addPolyline).toHaveBeenCalledWith(
                jasmine.objectContaining({ path: [latLng, latLng] })
            )
        })

        it('sets polyline color from color code', () => {
            googleMapsFactory.createLatLng.withArgs(new Coordinates(1, 1)).and.returnValue(latLng)

            component.addTravelPath([(new TimestampCoordinates(new Coordinates(1, 1), 0))], '')

            const colorRegex = /^#([A-Fa-f0-9]{3,6})$/
            expect(googleMapsBuilderSpy.addPolyline.calls.mostRecent().args[0].strokeColor).toMatch(colorRegex)
        })
    })
})