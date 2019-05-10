import * as GoogleMapsApi from 'load-google-maps-api'
import { FormsModule } from '@angular/forms'
import { InjectionToken, NgModule } from '@angular/core'
import { MatIconModule } from '@angular/material'
import { AngularGoogleMapsComponent } from './angular-google-maps.component'
import { AngularGoogleMapsService } from './angular-google-maps.service'

export const GoogleMaps = new InjectionToken<GoogleMapsApi>('GoogleMaps')
export const GoogleMapsApiKey = new InjectionToken<string>('GoogleMapsApiKey')

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
        {provide: GoogleMaps, useValue: GoogleMapsApi}
    ]
})
export class AngularGoogleMapsModule {
}
