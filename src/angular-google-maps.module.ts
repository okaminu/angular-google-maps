import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsListenerService } from './service/angular-google-maps-listener.service'
import { AngularGoogleMapsService } from './service/angular-google-maps.service'
import { GoogleMapsSingleton } from './service/google-maps-singleton.service'
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
        AngularGoogleMapsListenerService,
        AngularGoogleMapsService,
        GoogleMapsService,
        GoogleMapsSingleton
    ]
})
export class AngularGoogleMapsModule {
}
