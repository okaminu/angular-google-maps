import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsListenerService } from './angular-google-maps-listener.service'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { Location } from './location'
import Map = google.maps.Map
import Marker = google.maps.Marker
import SearchBox = google.maps.places.SearchBox
import any = jasmine.any
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsListenerService', () => {

    let service: AngularGoogleMapsListenerService
    let googleMapsService: AngularGoogleMapsService
    let eventPublisherSpy: SpyObj<EventPublisher>

    const location = {
        lat: () => 10,
        lng: () => 15
    }
    const mouseEvent = {
        latLng: location
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsListenerService,
                {
                    provide: AngularGoogleMapsService,
                    useValue: createSpyObj('AngularGoogleMapsService', ['reverseGeocode'])
                },
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])}
            ]
        })
        eventPublisherSpy = TestBed.get(EventPublisher)
        googleMapsService = TestBed.get(AngularGoogleMapsService)
        service = TestBed.get(AngularGoogleMapsListenerService)
    })

    it('should handle location change', () => {
        service.getLocationChangedHandler()(mouseEvent)

        expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
        expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(location.lat(), location.lng()))
        expect(googleMapsService.reverseGeocode).toHaveBeenCalledWith(new Location(location.lat(), location.lng()))
    })

    it('should bind marker to map', () => {
        const markerSpy: SpyObj<Marker> = createSpyObj('google.maps.Marker', ['setMap', 'setPosition'])
        const mapDummy: SpyObj<Map> = createSpyObj('google.maps.Map', [''])

        service.getBindMarkerToMapHandler(markerSpy, mapDummy)(mouseEvent)

        expect(markerSpy.setMap).toHaveBeenCalledWith(mapDummy)
        expect(markerSpy.setPosition).toHaveBeenCalledWith(mouseEvent.latLng)
        expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
        expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(location.lat(), location.lng()))
        expect(googleMapsService.reverseGeocode).toHaveBeenCalledWith(new Location(location.lat(), location.lng()))
    })

    it('should handle location change for search box, map and marker', () => {
        const markerSpy: SpyObj<Marker> = createSpyObj('google.maps.Marker', ['setMap', 'setPosition'])
        const mapSpy: SpyObj<Map> = createSpyObj('google.maps.Map', ['panTo', 'setZoom'])
        const searchBoxStub: SpyObj<SearchBox> = createSpyObj('google.maps.places.SearchBox', ['getPlaces'])
        searchBoxStub.getPlaces.and.returnValue([{
            geometry: {
                location: location
            }
        }] as any[])

        service.getLocationChangedSearchBoxMapMarkerHandler(searchBoxStub, mapSpy, markerSpy)()

        expect(mapSpy.panTo).toHaveBeenCalledWith(location)
        expect(mapSpy.setZoom).toHaveBeenCalledWith(any(Number))
        expect(markerSpy.setMap).toHaveBeenCalledWith(mapSpy)
        expect(markerSpy.setPosition).toHaveBeenCalledWith(location)
        expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
        expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(location.lat(), location.lng()))
    })

    it('should handle marker deletion', () => {
        const elementStub: SpyObj<HTMLInputElement> = createSpyObj('HTMLInputElement', [''])
        const markerSpy: SpyObj<Marker> = createSpyObj('google.maps.Marker', ['setMap'])
        document.getElementById = createSpy('document').and.callFake(id => {
            if (id === 'search-input')
                return elementStub
            else throw Error()
        })

        service.getLocationDeletedMarkerHandler(markerSpy)()

        expect(markerSpy.setMap).toHaveBeenCalledWith(null)
        expect(eventPublisherSpy.notify).toHaveBeenCalledWith('locationDeleted')
        expect(elementStub.value).toEqual('')
    })

})
