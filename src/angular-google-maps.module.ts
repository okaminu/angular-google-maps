import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsGeocoder } from './service/angular-google-maps-geocoder.service'
import { GoogleMapsLoader } from './service/google-maps-loader.service'
import { GoogleMapsFactory } from './service/google-maps-factory.service'

@NgModule({
    declarations: [
        AngularGoogleMapsComponent
    ],
    imports: [
        FormsModule,
        MatIconModule
    ],
    exports: [
        AngularGoogleMapsComponent
    ],
    providers: [
        AngularGoogleMapsGeocoder,
        GoogleMapsLoader,
        GoogleMapsFactory
    ]
})
export class AngularGoogleMapsModule {
}
