import { Injectable } from '@angular/core'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer } from '@angular/platform-browser'

@Injectable()
export class IconRegistry {

    constructor(private iconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer) {
    }

    register(iconName: string, resourceUrl: string) {
        this.iconRegistry.addSvgIcon(iconName, this.sanitizer.bypassSecurityTrustResourceUrl(resourceUrl))
    }

}
