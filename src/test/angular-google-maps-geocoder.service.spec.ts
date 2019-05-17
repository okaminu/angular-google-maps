import { TestBed } from '@angular/core/testing'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsService } from '../service/google-maps.service'
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsGeocoder', () => {

    let googleMapsSpy: SpyObj<GoogleMapsService>
    let eventPublisherSpy: SpyObj<EventPublisher>
    let geocoderSpy: SpyObj<google.maps.Geocoder>
    let geocoderService: AngularGoogleMapsGeocoder

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsGeocoder,
                {
                    provide: GoogleMapsService,
                    useValue: createSpyObj('GoogleMapsService', ['createGeocoder', 'createLatLng'])
                },
                {provide: EventPublisher, useValue: createSpyObj('EventPublisher', ['notify'])}
            ]
        })
        geocoderSpy = createSpyObj('google.maps.Geocoder', ['geocode'])

        googleMapsSpy = TestBed.get(GoogleMapsService)
        googleMapsSpy.createGeocoder.and.returnValue(geocoderSpy)
        eventPublisherSpy = TestBed.get(EventPublisher)

        geocoderService = TestBed.get(AngularGoogleMapsGeocoder)
    })

    describe('Reverse geocoding', () => {

        it('converts location to address', () => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{formatted_address: 'address'}], null)
            )

            geocoderService.reverseGeocode(new Location(1, 1))

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'address')
        })

        it('returns location on no results', () => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.createLatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))
            latLngSpy.toString.and.returnValue('location')

            geocoderService.reverseGeocode(new Location(1, 1))

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        })

        it('returns location on empty results', () => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsSpy.createLatLng.and.returnValue(latLngSpy)
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))
            latLngSpy.toString.and.returnValue('location')

            geocoderService.reverseGeocode(new Location(1, 1))

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), 'location')
        })

    })

    describe('Geocoding', () => {

        it('converts address to location', () => {
            geocoderSpy.geocode.and.callFake(
                (request, callback: any) => callback([{geometry: {location: {lat: () => 1.0, lng: () => 2.0}}}], null)
            )

            geocoderService.geocode('address')

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), new Location(1.0, 2.0))
        })

        it('returns default location on no results', () => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback(null, null))

            geocoderService.geocode('address')

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        })

        it('returns default location on empty results', () => {
            geocoderSpy.geocode.and.callFake((request, callback) => callback([], null))

            geocoderService.geocode('address')

            expect(eventPublisherSpy.notify).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Location))
        })

    })

})