import { Injectable } from '@angular/core'
import { GoogleMapsService } from './google-maps.service'
import Map = google.maps.Map

@Injectable()
export class AngularGoogleMapsService {

    constructor(private googleMaps: GoogleMapsService) {
    }

    createSearchBox(map: Map) {
        const searchBoxInput = <HTMLInputElement>document.getElementById('search-input')
        const searchBox = this.googleMaps.createSearchBox(searchBoxInput)

        map.controls[this.googleMaps.getGoogleMaps().ControlPosition.TOP_LEFT].push(searchBoxInput)

        return searchBox
    }

    addResizeControl(map: google.maps.Map) {
        const resizeControl = document.getElementById('resize-control')
        map.controls[this.googleMaps.getGoogleMaps().ControlPosition.TOP_RIGHT].push(resizeControl)
        return Promise.resolve(resizeControl)
    }

}
