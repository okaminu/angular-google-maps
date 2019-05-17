import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { Location } from '../location'
import { AngularGoogleMapsGeocoder } from './angular-google-maps-geocoder'
import Map = google.maps.Map
import Marker = google.maps.Marker
import SearchBox = google.maps.places.SearchBox

@Injectable()
export class AngularGoogleMapsListenerService {

    constructor(
        private geocoder: AngularGoogleMapsGeocoder,
        private eventPublisher: EventPublisher) {
    }

    getLocationChangedHandler() {
        return mouseEvent => {
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.geocoder.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    getBindMarkerToMapHandler(marker: Marker, map: Map) {
        return mouseEvent => {
            marker.setMap(map)
            marker.setPosition(mouseEvent.latLng)
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.geocoder.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    getLocationChangedSearchBoxMapMarkerHandler(searchBox: SearchBox, map: Map, markerToBind: Marker) {
        return () => {
            const placeLocation = searchBox.getPlaces()[0].geometry.location
            map.panTo(placeLocation)
            map.setZoom(15)
            markerToBind.setMap(map)
            markerToBind.setPosition(placeLocation)
            this.eventPublisher.notify('locationChanged', new Location(placeLocation.lat(), placeLocation.lng()))
        }
    }

    getLocationDeletedMarkerHandler(marker: Marker) {
        return () => {
            marker.setMap(null)
            this.eventPublisher.notify('locationDeleted')

            const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
            searchBoxInput.value = ''
        }
    }
}
