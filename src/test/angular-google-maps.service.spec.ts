import { fakeAsync, TestBed } from '@angular/core/testing'
import { Location } from '../location'
import { AngularGoogleMapsListenerService } from '../service/angular-google-maps-listener.service'
import { AngularGoogleMapsService } from '../service/angular-google-maps.service'
import { GoogleMapsService } from '../service/google-maps.service'
import Marker = google.maps.Marker
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsService', () => {

    let googleMaps: SpyObj<GoogleMapsService>
    let service: AngularGoogleMapsService
    let listenerServiceSpy: SpyObj<AngularGoogleMapsListenerService>

    const position = {lat: 10, lng: 15}
    const focusLocation = new Location(10, 15)

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsService,
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService',
                        ['getGoogleMaps', 'createMap', 'createMarker', 'createSearchBox'])
                },
                {
                    provide: AngularGoogleMapsListenerService,
                    useValue: createSpyObj('AngularGoogleMapsListenerService',
                        ['getLocationChangedHandler', 'getBindMarkerToMapHandler',
                            'getLocationChangedSearchBoxMapMarkerHandler', 'getLocationDeletedMarkerHandler'])
                }
            ]
        })
        googleMaps = TestBed.get(GoogleMapsService)
        listenerServiceSpy = TestBed.get(AngularGoogleMapsListenerService)

        service = TestBed.get(AngularGoogleMapsService)
    })

    afterEach(() =>
        document.getElementById = createSpy('document').and.callThrough()
    )

    describe('Building Google Maps', () => {

        let mapSpy: SpyObj<any>
        let markerSpy: SpyObj<Marker>
        let mapOptionsSpy: SpyObj<any>
        let markerOptionsSpy: SpyObj<any>

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['getCenter', 'addListener'])
            markerSpy = createSpyObj('google.maps.Marker', ['addListener'])
            mapOptionsSpy = createSpyObj('google.maps.MapOptions', [''])
            markerOptionsSpy = createSpyObj('google.maps.MarkerOptions', [''])

            googleMaps.createMap.and.returnValue(mapSpy)
            googleMaps.createMarker.and.returnValue(markerSpy)
        })

        describe('On map building', () => {

            it('builds a map', () => {
                expect(service
                    .createMap(mapOptionsSpy, mapOptionsSpy)
                    .build()
                ).toBe(mapSpy)
            })

            it('map is centered by provided location', () => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .build()

                expect(mapOptionsSpy.center).toEqual({
                    lat: focusLocation.latitude,
                    lng: focusLocation.longitude
                })
                expect(googleMaps.createMap).toHaveBeenCalledWith(mapOptionsSpy)
            })

        })

        describe('On marker building', () => {

            let handlerDummy: SpyObj<() => void>

            beforeEach(() => {
                handlerDummy = createSpyObj('ListenerHandler', [''])
            })

            it('adds a marker', () => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(googleMaps.createMarker).toHaveBeenCalled()
            })

            it('adds a marker aligned with map position', () => {
                mapSpy.getCenter.and.returnValue(position)

                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerOptionsSpy.position).toEqual(position)
            })

            it('marker is bound to map if marker location are provided', () => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerOptionsSpy.map).toEqual(mapSpy)
            })

            it('marker is not bound to map if location is not provided', () => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, false)
                    .build()

                expect(markerOptionsSpy.map).toBeUndefined()
            })

            it('adds location changed marker listener', () => {
                listenerServiceSpy.getLocationChangedHandler.and.returnValue(handlerDummy)

                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerSpy.addListener).toHaveBeenCalledWith('dragend', handlerDummy)
                expect(listenerServiceSpy.getLocationChangedHandler).toHaveBeenCalled()
            })

            it('adds location deleted marker listener', () => {
                listenerServiceSpy.getLocationDeletedMarkerHandler.and.returnValue(handlerDummy)

                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerSpy.addListener).toHaveBeenCalledWith('dblclick', handlerDummy)
                expect(listenerServiceSpy.getLocationDeletedMarkerHandler).toHaveBeenCalledWith(markerSpy)
            })

            it('binds map click to marker position update', () => {
                listenerServiceSpy.getBindMarkerToMapHandler.and.returnValue(handlerDummy)

                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(mapSpy.addListener).toHaveBeenCalledWith('click', handlerDummy)
                expect(listenerServiceSpy.getBindMarkerToMapHandler).toHaveBeenCalledWith(markerSpy, mapSpy)
            })

        })

        describe('Custom expand control', () => {
            let elementSpy: SpyObj<HTMLElement>
            let controlSpy: SpyObj<google.maps.MVCArray<Node>[]>

            beforeEach(() => {
                document.getElementById = createSpy('HTMLElement').and.callFake(id => {
                    if (id === 'resize-control')
                        return elementSpy
                    else throw Error()
                })
                elementSpy = createSpyObj('HTMLElement', [''])
                controlSpy = createSpyObj('google.maps.Map.controls', ['push'])
                mapSpy.controls = {
                    'somePosition': controlSpy
                }
                googleMaps.getGoogleMaps.and.returnValue({
                    ControlPosition: {
                        TOP_RIGHT: 'somePosition'
                    }
                })
            })

            it('adds resize control to map', () => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addResizeControl()
                    .build()

                expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
            })

        })

        describe('On search box creation', () => {

            let elementSpy: SpyObj<HTMLElement>
            let controlSpy: SpyObj<google.maps.MVCArray<Node>[]>
            let searchBoxSpy: SpyObj<google.maps.places.SearchBox>

            beforeEach(() => {
                document.getElementById = createSpy('document').and.callFake(id => {
                    if (id === 'search-input')
                        return elementSpy
                    else throw Error()
                })
                elementSpy = createSpyObj('HTMLElement', [''])
                controlSpy = createSpyObj('google.maps.Map.controls', ['push'])
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
                googleMaps.createSearchBox.and.returnValue(searchBoxSpy)
                googleMaps.getGoogleMaps.and.returnValue({
                    ControlPosition: {
                        TOP_LEFT: 'somePosition'
                    }
                })
            })

            it('adds search box', fakeAsync(() => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .addSearchBox()
                    .build()

                expect(googleMaps.createSearchBox).toHaveBeenCalledWith(elementSpy)
            }))

            it('adds search box with configured location', fakeAsync(() => {
                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .addSearchBox()
                    .build()

                expect(controlSpy.push).toHaveBeenCalledWith(elementSpy)
            }))

            it('adds listener for a search box', () => {
                const handlerDummy: SpyObj<() => void> = createSpyObj('ListenerHandler', [''])
                listenerServiceSpy.getLocationChangedSearchBoxMapMarkerHandler.and.returnValue(handlerDummy)

                service
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .addSearchBox()
                    .build()

                expect(searchBoxSpy.addListener).toHaveBeenCalledWith('places_changed', handlerDummy)
                expect(listenerServiceSpy.getLocationChangedSearchBoxMapMarkerHandler)
                    .toHaveBeenCalledWith(searchBoxSpy, mapSpy, markerSpy)
            })

        })

    })

})
