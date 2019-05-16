import { fakeAsync, TestBed } from '@angular/core/testing'
import { AngularGoogleMapsService } from '../service/angular-google-maps.service'
import { GoogleMapsSingleton } from '../service/google-maps-singleton.service'
import createSpy = jasmine.createSpy
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('AngularGoogleMapsService', () => {

    let googleMaps: SpyObj<GoogleMapsSingleton>
    let service: AngularGoogleMapsService

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AngularGoogleMapsService,
                {provide: GoogleMapsSingleton, useValue: createSpy('GoogleMapsSingleton')}
            ]
        })
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