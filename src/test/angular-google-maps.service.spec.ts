import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { AngularGoogleMapsService } from '../service/angular-google-maps.service'
import { GoogleMapsSingleton } from '../service/google-maps-singleton.service'
import Geocoder = google.maps.Geocoder
import Map = google.maps.Map
import Marker = google.maps.Marker
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsService', () => {

    let googleMaps: SpyObj<GoogleMapsSingleton>
    let service: AngularGoogleMapsService
    let eventPublisherSpy: SpyObj<EventPublisher>

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsService,
                {provide: GoogleMapsSingleton, useValue: createSpy('GoogleMapsSingleton')},
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        googleMaps = TestBed.get(GoogleMapsSingleton)
        service = TestBed.get(AngularGoogleMapsService)
    })

    afterEach(() =>
        document.getElementById = createSpy('document').and.callThrough()
    )

    describe('SearchBox', () => {

        const position = {lat: 10, lng: 10}
        let elementSpy: SpyObj<HTMLElement>
        let controlSpy: SpyObj<google.maps.MVCArray<Node>[]>
        let mapSpy: SpyObj<any>
        let markerSpy: SpyObj<google.maps.Marker>
        let searchBoxSpy: SpyObj<google.maps.places.SearchBox>

        beforeEach(() => {
            document.getElementById = createSpy('document').and.callFake(id => {
                if (id === 'search-input')
                    return elementSpy
                else throw Error()
            })
            elementSpy = createSpyObj('HTMLElement', [''])
            controlSpy = createSpyObj('google.maps.Map.controls', ['push'])
            mapSpy = createSpyObj('google.maps.Map', ['controls', 'panTo', 'setZoom'])
            markerSpy = createSpyObj('google.maps.Marker', ['setPosition', 'setMap'])
            searchBoxSpy = createSpyObj('google.maps.places.SearchBox', ['addListener', 'getPlaces'])

            mapSpy.controls = {
                'somePosition': controlSpy
            }
            searchBoxSpy.getPlaces.and.returnValue([{
                geometry: {
                    location: {
                        lat: () => position.lat,
                        lng: () => position.lng
                    }
                }
            }] as any[])
            googleMaps.singleton = {
                ControlPosition: {
                    TOP_LEFT: 'somePosition'
                },
                places: {
                    SearchBox: function (element) {
                        if (element === elementSpy)
                            return searchBoxSpy
                        else throw Error()
                    }
                }
            }
        })

        it('is added to map', fakeAsync(() => {
            const searchBox = service.createSearchBox(mapSpy)

            expect(searchBox).toBe(searchBoxSpy)
            expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
        }))
    })

    describe('Reverse geocoding: ', () => {

        let geocoderSpy: SpyObj<google.maps.Geocoder>
        let googleMapsSpy: SpyObj<any>

        beforeEach(() => {
            geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy = createSpyObj('google.maps', ['Geocoder', 'LatLng'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)
            googleMaps.singleton = googleMapsSpy
        })

        it('converts location to address', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{formatted_address: 'address'}], null)
            )

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'address')
        }))

        it('returns location on no results', fakeAsync(() => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.LatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        }))

        it('returns location on empty results', fakeAsync(() => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.LatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        }))

    })

    describe('Geocoder', () => {

        let geocoderSpy: SpyObj<Geocoder>
        let googleMapsSpy: SpyObj<any>

        beforeEach(() => {
            geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy = createSpyObj('google.maps', ['Geocoder'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)
            googleMaps.singleton = googleMapsSpy
        })


        it('converts address to location', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{geometry: {location: {lat: () => 1.0, lng: () => 2.0}}}], null)
            )

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), new Location(1.0, 2.0))
        }))

        it('returns default location on no results', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        }))

        it('returns default location on empty results', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        }))

    })

    describe('Custom expand control', () => {
        let elementSpy: SpyObj<HTMLElement>
        let controlSpy: SpyObj<google.maps.MVCArray<Node>[]>
        let mapSpy: SpyObj<any>

        beforeEach(() => {
            document.getElementById = createSpy('HTMLElement').and.callFake(id => {
                if (id === 'resize-control')
                    return elementSpy
                else throw Error()
            })
            elementSpy = createSpyObj('HTMLElement', [''])
            controlSpy = createSpyObj('google.maps.Map.controls', ['push'])
            mapSpy = createSpyObj('google.maps.Map', [''])

            mapSpy.controls = {
                'somePosition': controlSpy
            }
            googleMaps.singleton = {
                ControlPosition: {
                    TOP_RIGHT: 'somePosition'
                }
            }
        })

        it('adds resize control to map', fakeAsync(() => {
            service
                .addResizeControl(mapSpy)
                .then(control => {
                    expect(control).toBe(elementSpy)
                    expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
                })
        }))

    })

})