import { Injectable } from '@angular/core'
import GoogleMapsApi from 'load-google-maps-api'

@Injectable()
export class GoogleMapsSingleton {

    singleton: any

    load(googleMapsApiKey: string) {
        return Promise.resolve(GoogleMapsApi({key: googleMapsApiKey, libraries: ['places']}))
            .then(googleMaps => this.singleton = googleMaps)
    }

}
