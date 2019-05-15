import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { Location } from './location'
import Map = google.maps.Map
import Marker = google.maps.Marker

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

}
