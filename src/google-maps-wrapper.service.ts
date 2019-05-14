import { Inject, Injectable, InjectionToken } from '@angular/core'
import GoogleMapsApi from 'load-google-maps-api'

export const GoogleMapsApiKey = new InjectionToken<string>('GoogleMapsApiKey')

@Injectable()
export class GoogleMapsWrapperService {

    constructor(@Inject(GoogleMapsApiKey) private readonly googleMapsApiKey) {
    }

    load() {
        return Promise.resolve(GoogleMapsApi({key: this.googleMapsApiKey, libraries: ['places']}))
    }

}