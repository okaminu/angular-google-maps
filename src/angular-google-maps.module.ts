import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsBuilder } from './service/angular-google-maps-builder.service'
import { AngularGoogleMapsGeocoder } from './service/angular-google-maps-geocoder.service'
import { AngularGoogleMapsListener } from './service/angular-google-maps-listener.service'
import { GoogleMapsLoader } from './service/google-maps-loader.service'
import { GoogleMapsService } from './service/google-maps.service'

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
        AngularGoogleMapsBuilder,
        AngularGoogleMapsGeocoder,
        AngularGoogleMapsListener,
        GoogleMapsLoader,
        GoogleMapsService
    ]
})
export class AngularGoogleMapsModule {
}
