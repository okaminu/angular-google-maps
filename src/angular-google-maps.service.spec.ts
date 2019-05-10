import { fakeAsync, TestBed, tick } from '@angular/core/testing'

import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from './location'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { GoogleMaps, GoogleMapsApiKey } from './angular-google-maps.module'
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsService:', () => {

    let googleMaps: SpyObj<any>
    let service: AngularGoogleMapsService
    let eventPublisherSpy: SpyObj<EventPublisher>

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsService,
                {provide: GoogleMaps, useValue: createSpy('googleMaps')},
                {provide: GoogleMapsApiKey, useValue: 'secret_key'},
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        googleMaps = TestBed.get(GoogleMaps)
        service = TestBed.get(AngularGoogleMapsService)
    })

    afterEach(() =>
        document.getElementById = createSpy('document').and.callThrough()
    )

    it('Inits Google maps', fakeAsync(() => {
        service.initGoogleMaps()
            .then(() => {
                expect(googleMaps).toHaveBeenCalledWith({key: 'secret_key', libraries: ['places']})
            })
    }))

    it('Creates Google maps', fakeAsync(() => {
        const mapOptions = {draggable: true}
        const elementSpy = createSpyObj('HTMLElement', [''])
        const mapSpy = createSpyObj('google.maps.Map', [''])
        const googleMapsSpy = createSpyObj('google.maps', ['Map'])
        document.getElementById = createSpy('document').and.callFake(id => {
            if (id === 'map')
                return elementSpy
            else throw Error()
        })
        googleMapsSpy.Map.and.callFake((element, options) => {
            if (element === elementSpy && options === mapOptions)
                return mapSpy
        })
        googleMaps.and.returnValue(Promise.resolve(googleMapsSpy))

        service.createMap(mapOptions)
            .then(mapPromise => {
                expect(mapPromise).toBe(mapSpy)
                expect(googleMaps).toHaveBeenCalledWith({key: 'secret_key', libraries: ['places']})
            })
    }))

    describe('Marker: ', () => {

        const position = {lat: 10, lng: 10}
        const markerOptions = {position: position}
        const mouseEvent = {
            latLng: {
                lat: () => position.lat,
                lng: () => position.lng
            }
        }
        let markerSpy: SpyObj<google.maps.Marker>
        let googleMapsSpy: SpyObj<any>

        beforeEach(() => {
            markerSpy = createSpyObj('google.maps.Marker', ['addListener', 'setPosition', 'setMap'])
            googleMapsSpy = createSpyObj('google.maps', ['Marker', 'LatLng', 'Geocoder', 'addListener'])
            googleMapsSpy.Marker.and.returnValue(markerSpy)
            googleMaps.and.returnValue(Promise.resolve(googleMapsSpy))
        })

        it('Adds marker to map', fakeAsync(() => {
            service
                .addMarker(markerOptions)
                .then(marker => {
                    expect(marker).toBe(markerSpy)
                    expect(googleMapsSpy.Marker).toHaveBeenCalledWith(markerOptions)
                })
        }))

        it('Adds drag listener for a marker', fakeAsync(() => {
            const geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback([{formatted_address: 'address'}]))

            service
                .addMarker(markerOptions)
                .then(() => {
                    markerSpy.addListener.calls.first().args[1](mouseEvent)

                    tick()

                    expect(markerSpy.addListener).toHaveBeenCalledWith('dragend', jasmine.any(Function))
                    expect(eventPublisherSpy.notify.calls.first().args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.first().args[1])
                        .toEqual(new Location(position.lat, position.lng))
                })
        }))

        it('Adds delete listener for marker', fakeAsync(() => {
            let elementSpy: SpyObj<HTMLInputElement>
            document.getElementById = createSpy('document').and.callFake(id => {
                if (id === 'search-input')
                    return elementSpy
                else throw Error()
            })
            elementSpy = createSpyObj('HTMLInputElement', [''])

            service
                .addMarker(markerOptions)
                .then(() => {
                    markerSpy.addListener.calls.mostRecent().args[1]()

                    expect(markerSpy.addListener).toHaveBeenCalledWith('dblclick', jasmine.any(Function))
                    expect(markerSpy.setMap).toHaveBeenCalledWith(null)
                    expect(elementSpy.value).toEqual('')
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith('locationDeleted')
                })
        }))

        it('Bind marker to map click', fakeAsync(() => {
            const geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)

            service.bindMarkerToMapClick(markerSpy, googleMapsSpy)
            googleMapsSpy.addListener.calls.first().args[1](mouseEvent)
            tick()

            expect(googleMapsSpy.addListener).toHaveBeenCalledWith('click', jasmine.any(Function))
            expect(markerSpy.setPosition).toHaveBeenCalledWith(mouseEvent.latLng)
            expect(markerSpy.setMap).toHaveBeenCalledWith(googleMapsSpy)
            expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
            expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(position.lat, position.lng))
            expect(geocoderSpy.geocode).toHaveBeenCalled()
        }))
    })

    describe('SearchBox: ', () => {

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
            googleMaps.and.returnValue(Promise.resolve({
                ControlPosition: {
                    TOP_LEFT: 'somePosition'
                },
                places: {
                    SearchBox: element => {
                        if (element === elementSpy)
                            return searchBoxSpy
                        else throw Error()
                    }
                }
            }))
        })

        it('Adds search box to map', fakeAsync(() => {
            service
                .addSearchBox(mapSpy, markerSpy)
                .then(searchBox => {
                    expect(searchBox).toBe(searchBoxSpy)
                    expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
                })
        }))

        it('Adds listener for a searchBox', fakeAsync(() => {
            service
                .addSearchBox(mapSpy, markerSpy)
                .then(() => {
                    searchBoxSpy.addListener.calls.first().args[1]()

                    expect(searchBoxSpy.addListener).toHaveBeenCalledWith('places_changed', jasmine.any(Function))
                    expect(mapSpy.panTo).toHaveBeenCalled()
                    expect(mapSpy.setZoom).toHaveBeenCalled()
                    expect(markerSpy.setPosition).toHaveBeenCalled()
                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(eventPublisherSpy.notify.calls.first().args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.first().args[1])
                        .toEqual(new Location(position.lat, position.lng))
                })
        }))
    })

    describe('Reverse geocoding: ', () => {

        let geocoderSpy: SpyObj<google.maps.Geocoder>
        let googleMapsSpy: SpyObj<any>

        beforeEach(() => {
            geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy = createSpyObj('google.maps', ['Geocoder', 'LatLng'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)
            googleMaps.and.returnValue(Promise.resolve(googleMapsSpy))
        })

        it('Converts location to address', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{formatted_address: 'address'}], null)
            )

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'address')
        }))

        it('Returns location on no results', fakeAsync(() => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.LatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        }))

        it('Returns location on empty results', fakeAsync(() => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.LatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1))
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        }))

    })

    describe('Geocoding: ', () => {

        let geocoderSpy: SpyObj<google.maps.Geocoder>
        let googleMapsSpy: SpyObj<any>

        beforeEach(() => {
            geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])
            googleMapsSpy = createSpyObj('google.maps', ['Geocoder'])
            googleMapsSpy.Geocoder.and.returnValue(geocoderSpy)
            googleMaps.and.returnValue(Promise.resolve(googleMapsSpy))
        })


        it('Converts address to location', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{geometry: {location: {lat: () => 1.0, lng: () => 2.0}}}], null)
            )

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), new Location(1.0, 2.0))
        }))

        it('Returns default location on no results', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        }))

        it('Returns default location on empty results', fakeAsync(() => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))

            service.geocode('address')
            tick()

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        }))

    })

    describe('Custom expand control: ', () => {
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
            googleMaps.and.returnValue(Promise.resolve({
                ControlPosition: {
                    TOP_RIGHT: 'somePosition'
                }
            }))
        })

        it('Adds resize control to map', fakeAsync(() => {
            service
                .addResizeControl(mapSpy)
                .then(control => {
                    expect(control).toBe(elementSpy)
                    expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
                })
        }))

    })

})