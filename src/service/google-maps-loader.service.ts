import { Injectable } from '@angular/core'
import GoogleMapsApi from 'load-google-maps-api'

@Injectable()
export class GoogleMapsLoader {

    static load(googleMapsApiKey: string) {
        return Promise.resolve(GoogleMapsApi({key: googleMapsApiKey, libraries: ['places']}))
    }

}
