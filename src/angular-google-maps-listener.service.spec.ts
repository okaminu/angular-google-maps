import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsListenerService } from './angular-google-maps-listener.service'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { Location } from './location'
import Map = google.maps.Map
import Marker = google.maps.Marker
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsListenerService', () => {

    let service: AngularGoogleMapsListenerService
    let googleMapsService: AngularGoogleMapsService
    let eventPublisherSpy: SpyObj<EventPublisher>

    const position = {lat: 10, lng: 10}
    const mouseEvent = {
        latLng: {
            lat: () => position.lat,
            lng: () => position.lng
        }
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

    it('should handle location change for marker', () => {
        service.getLocationChangedMarkerHandler()(mouseEvent)

        expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
        expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(position.lat, position.lng))
        expect(googleMapsService.reverseGeocode).toHaveBeenCalledWith(new Location(position.lat, position.lng))
    })

    it('should handle location change for map', () => {
        const markerSpy: SpyObj<Marker> = createSpyObj('google.maps.Marker', ['setMap', 'setPosition'])
        const mapDummy: SpyObj<Map> = createSpyObj('google.maps.Map', [''])

        service.getLocationChangedMapHandler(markerSpy, mapDummy)(mouseEvent)

        expect(markerSpy.setMap).toHaveBeenCalledWith(mapDummy)
        expect(markerSpy.setPosition).toHaveBeenCalledWith(mouseEvent.latLng)
        expect(eventPublisherSpy.notify.calls.first().args[0]).toEqual('locationChanged')
        expect(eventPublisherSpy.notify.calls.first().args[1]).toEqual(new Location(position.lat, position.lng))
        expect(googleMapsService.reverseGeocode).toHaveBeenCalledWith(new Location(position.lat, position.lng))
    })

})