import { TestBed } from '@angular/core/testing'
import { MatIconRegistry } from '@angular/material'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { IconRegistry } from './icon-registry'
import createSpyObj = jasmine.createSpyObj
import SpyObj = jasmine.SpyObj

describe('Icon registry: ', () => {
    let iconRegistry: IconRegistry
    let matIconRegistrySpy: SpyObj<MatIconRegistry>
    let domSanitizerSpy: SpyObj<DomSanitizer>

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                IconRegistry,
                {provide: MatIconRegistry, useValue: createSpyObj('MatIconRegistry', ['addSvgIcon'])},
                {provide: DomSanitizer, useValue: createSpyObj('DomSanitizer', ['bypassSecurityTrustResourceUrl'])}
            ]
        })
        matIconRegistrySpy = TestBed.get(MatIconRegistry)
        domSanitizerSpy = TestBed.get(DomSanitizer)
        iconRegistry = TestBed.get(IconRegistry)
    })

    it('Registers icon', () => {
        const safeResource = createSpyObj('SafeResourceUrl', [''])
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue(safeResource)

        iconRegistry.register('name', 'url')

        expect(matIconRegistrySpy.addSvgIcon).toHaveBeenCalledWith('name', safeResource)
        expect(domSanitizerSpy.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('url')
    })

})
