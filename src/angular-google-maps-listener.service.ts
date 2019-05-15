import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { Location } from './location'
import Map = google.maps.Map
import Marker = google.maps.Marker
import SearchBox = google.maps.places.SearchBox

@Injectable()
export class AngularGoogleMapsListenerService {

    constructor(
        private googleMapsService: AngularGoogleMapsService,
        private eventPublisher: EventPublisher) {
    }

    getLocationDeletedMarkerHandler(marker: Marker) {
        return () => {
            marker.setMap(null)
            this.eventPublisher.notify('locationDeleted')

            const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
            searchBoxInput.value = ''
        }
    }

    getLocationChangedMarkerHandler() {
        return mouseEvent => {
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.googleMapsService.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    getLocationChangedMapHandler(marker: Marker, map: Map) {
        return mouseEvent => {
            marker.setMap(map)
            marker.setPosition(mouseEvent.latLng)
            this.eventPublisher.notify('locationChanged',
                new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng())
            )
            this.googleMapsService.reverseGeocode(new Location(mouseEvent.latLng.lat(), mouseEvent.latLng.lng()))
        }
    }

    getLocationChangedSearchBoxHandler(searchBox: SearchBox, map: Map, markerToBind: Marker) {
        return () => {
            const placeLocation = searchBox.getPlaces()[0].geometry.location
            map.panTo(placeLocation)
            map.setZoom(15)
            markerToBind.setMap(map)
            markerToBind.setPosition(placeLocation)
            this.eventPublisher.notify('locationChanged', new Location(placeLocation.lat(), placeLocation.lng()))
        }
    }
}
