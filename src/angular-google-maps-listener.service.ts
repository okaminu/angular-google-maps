import { Injectable } from '@angular/core'
import { EventPublisher } from '@boldadmin/event-publisher'
import Marker = google.maps.Marker

@Injectable()
export class AngularGoogleMapsListenerService {

    constructor(private eventPublisher: EventPublisher) {
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
