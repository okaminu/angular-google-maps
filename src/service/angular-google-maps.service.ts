import { Injectable } from '@angular/core'
import { GoogleMapsSingleton } from './google-maps-singleton.service'
import Map = google.maps.Map

@Injectable()
export class AngularGoogleMapsService {

    constructor(private googleMaps: GoogleMapsSingleton) {
    }

    createSearchBox(map: Map) {
        const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
        const searchBox = new this.googleMaps.singleton.places.SearchBox(searchBoxInput)

        map.controls[this.googleMaps.singleton.ControlPosition.TOP_LEFT].push(searchBoxInput)

        return searchBox
    }

    addResizeControl(map: google.maps.Map) {
        const resizeControl = document.getElementById('resize-control')
        map.controls[this.googleMaps.singleton.ControlPosition.TOP_RIGHT].push(resizeControl)
        return Promise.resolve(resizeControl)
    }

}
