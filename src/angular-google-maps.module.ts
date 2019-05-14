import { FormsModule } from '@angular/forms'
import { NgModule } from '@angular/core'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsService } from './angular-google-maps.service'
import { GoogleMapsWrapperService } from './google-maps-wrapper.service'

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
        AngularGoogleMapsService,
        GoogleMapsWrapperService
    ]
})
export class AngularGoogleMapsModule {
}
