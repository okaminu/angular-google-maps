import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { AngularGoogleMapsBuilder } from '../service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsService } from '../service/google-maps.service'
import Marker = google.maps.Marker
import any = jasmine.any
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsBuilder', () => {

    let googleMaps: SpyObj<GoogleMapsService>
    let eventPublisherSpy: SpyObj<EventPublisher>
    let geocoderSpy: SpyObj<AngularGoogleMapsGeocoder>
    let builder: AngularGoogleMapsBuilder

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsBuilder,
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService',
                        ['getGoogleMaps', 'createMap', 'createMarker', 'createSearchBox', 'getSearchBoxInput'])
                },
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])},
                {
                    provide: AngularGoogleMapsGeocoder,
                    useValue: createSpyObj('AngularGoogleMapsGeocoder', ['reverseGeocode'])
                }
            ]
        })
        googleMaps = TestBed.get(GoogleMapsService)
        eventPublisherSpy = TestBed.get(EventPublisher)
        geocoderSpy = TestBed.get(AngularGoogleMapsGeocoder)

        builder = TestBed.get(AngularGoogleMapsBuilder)
    })

    describe('Building Google Maps', () => {

        let mapSpy: SpyObj<any>
        let markerSpy: SpyObj<Marker>
        let mapOptionsSpy: SpyObj<any>
        let markerOptionsSpy: SpyObj<any>

        const location = {
            lat: () => 10,
            lng: () => 15
        }
        const focusLocation = new Location(10, 15)
        const mouseEvent = {
            latLng: location
        }

        beforeEach(() => {
            mapSpy = createSpyObj('google.maps.Map', ['addListener', 'getCenter', 'panTo', 'setZoom'])
            markerSpy = createSpyObj('google.maps.Marker', ['addListener', 'setMap', 'setPosition'])
            mapOptionsSpy = createSpyObj('google.maps.MapOptions', [''])
            markerOptionsSpy = createSpyObj('google.maps.MarkerOptions', [''])

            googleMaps.createMap.and.returnValue(mapSpy)
            googleMaps.createMarker.and.returnValue(markerSpy)
        })

        describe('On map building', () => {

            it('builds a map', () => {
                expect(builder
                    .createMap(mapOptionsSpy, mapOptionsSpy)
                    .build()
                ).toBe(mapSpy)
            })

            it('map is centered to provided location', () => {
                builder
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
                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(googleMaps.createMarker).toHaveBeenCalled()
            })

            it('added marker is aligned with map location', () => {
                mapSpy.getCenter.and.returnValue(location)

                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerOptionsSpy.position).toEqual(location)
            })

            it('marker is bound to map if marker location is provided', () => {
                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerOptionsSpy.map).toEqual(mapSpy)
            })

            it('marker is not bound to map if location is not provided', () => {
                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, false)
                    .build()

                expect(markerOptionsSpy.map).toBeUndefined()
            })

            it('adds marker dragend listener to notify location change, reverse geocode and delete marker', () => {
                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(markerSpy.addListener).toHaveBeenCalledTimes(3)
                expect(markerSpy.addListener).toHaveBeenCalledWith('dragend', any(Function))
                expect(markerSpy.addListener).toHaveBeenCalledWith('dblclick', any(Function))
            })

            describe('Invoked marker dragend listener handler', () => {

                beforeEach(() => {
                    builder
                        .createMap(mapOptionsSpy, focusLocation)
                        .addMarker(markerOptionsSpy, true)
                        .build()
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[0].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

                it('reverse geocodes', () => {
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dragend')[1].args[1](mouseEvent)

                    expect(geocoderSpy.reverseGeocode)
                        .toHaveBeenCalledWith(new Location(location.lat(), location.lng()))
                })

                it('deletes marker', () => {
                    const elementStub: SpyObj<HTMLInputElement> = createSpyObj('HTMLInputElement', [''])
                    googleMaps.getSearchBoxInput.and.returnValue(elementStub)
                    getCallsByInvokedParameter(markerSpy.addListener.calls.all(), 'dblclick')[0].args[1](mouseEvent)

                    expect(markerSpy.setMap).toHaveBeenCalledWith(null)
                    expect(eventPublisherSpy.notify).toHaveBeenCalledWith('locationDeleted')
                    expect(elementStub.value).toEqual('')
                })

            })

            it('adds map click listener to update marker position, notify location change and reverse geocode', () => {
                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .build()

                expect(mapSpy.addListener).toHaveBeenCalledTimes(3)
                expect(mapSpy.addListener).toHaveBeenCalledWith('click', any(Function))
            })

            describe('Invoked map click listener handler', () => {

                beforeEach(() => {
                    builder
                        .createMap(mapOptionsSpy, focusLocation)
                        .addMarker(markerOptionsSpy, true)
                        .build()
                })

                it('binds marker to map and new location', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[0].args[1](mouseEvent)

                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[1].args[1](mouseEvent)

                    expect(eventPublisherSpy.notify.calls.all()[0].args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.all()[0].args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

                it('reverse geocodes', () => {
                    getCallsByInvokedParameter(mapSpy.addListener.calls.all(), 'click')[2].args[1](mouseEvent)

                    expect(geocoderSpy.reverseGeocode)
                        .toHaveBeenCalledWith(new Location(location.lat(), location.lng()))
                })

            })

        })

        describe('On search box building', () => {

            let searchBoxSpy: SpyObj<google.maps.places.SearchBox>

            beforeEach(() => {
                searchBoxSpy = createSpyObj('google.maps.places.SearchBox', ['addListener', 'getPlaces'])

                searchBoxSpy.getPlaces.and.returnValue([{
                    geometry: {
                        location: location
                    }
                }] as any[])
                googleMaps.createSearchBox.and.returnValue(searchBoxSpy)

                builder
                    .createMap(mapOptionsSpy, focusLocation)
                    .addMarker(markerOptionsSpy, true)
                    .addSearchBox()
                    .build()
            })

            it('adds search box', () => {
                expect(googleMaps.createSearchBox).toHaveBeenCalledWith()
            })

            it('add search box listener', () => {
                expect(searchBoxSpy.addListener).toHaveBeenCalledTimes(3)
                expect(searchBoxSpy.addListener).toHaveBeenCalledWith('places_changed', any(Function))
            })

            describe('Invoked search box listener handler', () => {

                it('focuses map to new location', () => {
                    getCallsByInvokedParameter(searchBoxSpy.addListener.calls.all(), 'places_changed')[0].args[1]()

                    expect(mapSpy.panTo).toHaveBeenCalledWith(location)
                    expect(mapSpy.setZoom).toHaveBeenCalledWith(any(Number))
                })

                it('binds marker to map and new location', () => {
                    getCallsByInvokedParameter(searchBoxSpy.addListener.calls.all(), 'places_changed')[1].args[1]()

                    expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
                    expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
                })

                it('notifies location change', () => {
                    getCallsByInvokedParameter(searchBoxSpy.addListener.calls.all(), 'places_changed')[2].args[1]()

                    expect(eventPublisherSpy.notify.calls.first().args[0])
                        .toEqual('locationChanged')
                    expect(eventPublisherSpy.notify.calls.first().args[1])
                        .toEqual(new Location(location.lat(), location.lng()))
                })

            })

        })

    })

    function getCallsByInvokedParameter(allCalls, firstParameterValue: string) {
        const matchedCalls = []
        for (const call of allCalls)
            if (call.args[0] === firstParameterValue)
                matchedCalls.push(call)
        return matchedCalls
    }

})
