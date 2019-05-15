import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsListenerService } from './angular-google-maps-listener.service'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { GoogleMapsSingleton } from './google-maps-singleton.service'

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
        GoogleMapsSingleton
    ]
})
export class AngularGoogleMapsModule {
}
