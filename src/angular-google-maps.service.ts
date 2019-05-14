import Map = google.maps.Map
import MapOptions = google.maps.MapOptions
import Marker = google.maps.Marker
import MarkerOptions = google.maps.MarkerOptions
import { EventPublisher } from '@boldadmin/event-publisher'
import { GoogleMapsWrapperService } from './google-maps-wrapper.service'
import { Injectable } from '@angular/core'
import { Location } from './location'

@Injectable()
export class AngularGoogleMapsService {

    constructor(private googleMapsWrapper: GoogleMapsWrapperService,
                private eventPublisher: EventPublisher) {
    }

    initGoogleMaps() {
        return Promise.resolve(this.googleMapsWrapper.load())
    }

    createMap(options: MapOptions) {
        return this
            .initGoogleMaps()
            .then(googleMaps => Promise.resolve(new googleMaps.Map(document.getElementById('map'), options)))
    }

    addMarker(options?: MarkerOptions) {
        return this
            .initGoogleMaps()
            .then(googleMaps => {
                const marker: Marker = new googleMaps.Marker(options)

                marker.addListener('dragend', mouseEvent => {
                    this.notifyLocationChange(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
                    this.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
                })

                marker.addListener('dblclick', () => {
                    marker.setMap(null)
                    this.eventPublisher.notify('locationDeleted')

                    const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
                    searchBoxInput.value = ''
                })

                return Promise.resolve(marker)
            })
    }

    bindMarkerToMapClick(marker: Marker, map: Map) {
        map.addListener('click', mouseEvent => {
            marker.setPosition(mouseEvent.latLng)
            marker.setMap(map)
            this.notifyLocationChange(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            this.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        })
    }

    addSearchBox(map: Map, markerToBind: Marker) {
        return this
            .initGoogleMaps()
            .then(googleMaps => {
                const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
                const searchBox = new googleMaps.places.SearchBox(searchBoxInput)

                map.controls[googleMaps.ControlPosition.TOP_LEFT].push(searchBoxInput)

                searchBox.addListener('places_changed', () => {
                    const placesFirstResult = searchBox.getPlaces()[0]
                    map.panTo(placesFirstResult.geometry.location)
                    map.setZoom(15)
                    markerToBind.setMap(map)
                    markerToBind.setPosition(placesFirstResult.geometry.location)
                    this.notifyLocationChange(
                        placesFirstResult.geometry.location.lat(), placesFirstResult.geometry.location.lng()
                    )
                })

                return Promise.resolve(searchBox)
            })
    }

    reverseGeocode(location: Location) {
        this.initGoogleMaps()
            .then(googleMaps => {
                const latLng = new googleMaps.LatLng(location.latitude, location.longitude)
                new googleMaps.Geocoder().geocode({'location': latLng}, results => {
                    if (results !== null && results[0])
                        this.eventPublisher.notify('addressReverseGeocoded', results[0].formatted_address)
                    else
                        this.eventPublisher.notify('addressReverseGeocoded', latLng.toString())
                })
            })
    }

    geocode(address: String): Promise<any> {
        return this.initGoogleMaps()
            .then(googleMaps => {
                return new googleMaps.Geocoder().geocode({'address': address}, results => {
                    if (results !== null && results[0])
                        this.eventPublisher.notify('onGeocodeAddress', new Location(results[0].geometry.location.lat(),
                            results[0].geometry.location.lng()))
                    else
                        this.eventPublisher.notify('onGeocodeAddress', new Location(59.9139, 10.7522))

                })
            })
    }

    addResizeControl(map: google.maps.Map) {
        return this.initGoogleMaps()
            .then(googleMaps => {
                const resizeControl = document.getElementById('resize-control')
                map.controls[googleMaps.ControlPosition.TOP_RIGHT].push(resizeControl)
                return Promise.resolve(resizeControl)
            })
    }

    private notifyLocationChange(lat: number, lng: number) {
        this.eventPublisher.notify('locationChanged', new Location(lat, lng))
    }

}