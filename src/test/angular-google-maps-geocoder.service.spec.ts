import { TestBed } from '@angular/core/testing'
import { Location } from '../location'
import { AngularGoogleMapsGeocoder } from '../service/angular-google-maps-geocoder.service'
import { GoogleMapsFactory } from '../service/google-maps-factory.service'
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj
import createSpy = jasmine.createSpy

describe('AngularGoogleMapsGeocoder', () => {

    let googleMapsFactoryStub: SpyObj<GoogleMapsFactory>
    let geocoderStub: SpyObj<google.maps.Geocoder>
    let service: AngularGoogleMapsGeocoder

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsGeocoder,
                {
                    provide: GoogleMapsFactory,
                    useValue: createSpyObj('GoogleMapsFactory', ['createGeocoder', 'createLatLng'])
                }
            ]
        })
        geocoderStub = createSpyObj('google.maps.Geocoder', ['geocode'])

        googleMapsFactoryStub = TestBed.get(GoogleMapsFactory)
        googleMapsFactoryStub.createGeocoder.and.returnValue(geocoderStub)

        service = TestBed.get(AngularGoogleMapsGeocoder)
    })

    describe('Geocoding', () => {

        it('converts address to location', () => {
            const callbackSpy = createSpy()
            geocoderStub.geocode.and.callFake(
                (request, callback: any) => callback([{geometry: {location: {lat: () => 1.0, lng: () => 2.0}}}])
            )

            service.geocode('address', callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith(new Location(1.0, 2.0))
        })

        it('returns default location on no results', () => {
            const callbackSpy = createSpy()
            geocoderStub.geocode.and.callFake((request, callback: any) => callback(null))

            service.geocode('address', callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith(jasmine.any(Location))
        })

        it('returns default location on empty results', () => {
            const callbackSpy = createSpy()
            geocoderStub.geocode.and.callFake((request, callback: any) => callback([]))

            service.geocode('address', callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith(jasmine.any(Location))
        })
    })

    describe('Reverse geocoding', () => {

        it('converts location to address', () => {
            const callbackSpy = createSpy()
            geocoderStub.geocode.and.callFake(
                (request, callback: any) => callback([{formatted_address: 'address'}])
            )

            service.reverseGeocode(new Location(1, 1), callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith('address')
        })

        it('returns location on no results', () => {
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            const callbackSpy = createSpy()
            googleMapsFactoryStub.createLatLng.and.returnValue(latLngSpy)
            geocoderStub.geocode.and.callFake((request, callback: any) => callback(null))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1), callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith('location')
        })

        it('returns location on empty results', () => {
            const callbackSpy = createSpy()
            const latLngSpy = createSpyObj('google.maps.LatLng', ['toString'])
            googleMapsFactoryStub.createLatLng.and.returnValue(latLngSpy)
            geocoderStub.geocode.and.callFake((request, callback: any) => callback([]))
            latLngSpy.toString.and.returnValue('location')

            service.reverseGeocode(new Location(1, 1), callbackSpy)

            expect(callbackSpy).toHaveBeenCalledWith('location')
        })

    })

})