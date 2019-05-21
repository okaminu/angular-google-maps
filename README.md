# angular-google-maps
This library integrates Google Maps functionality to Angular framework. 

## Installation

Install using node package manager:
```
$ npm install @boldadmin/angular-google-maps
```

## Usage
Add new provider just like in the sample to @NgModule annotation of app.module.ts file 
and replace YOUR_GOOGLE_MAPS_API_KEY with google maps api key:
```
@NgModule({
        providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: () => (() => GoogleMapsLoader.load('YOUR_GOOGLE_MAPS_API_KEY')),
            deps: [GoogleMapsLoader],
            multi: true
        }
    ]
})
```

Add new import just like in the sample to @NgModule annotation of module where you will be using angular-google-maps:
```
@NgModule({
    imports: [
        AngularGoogleMapsModule
    ]
})

```

Add the following element `<google-maps></google-maps>` to your html template where map will be displayed.

Add AngularGoogleMapsComponent reference inside your component:
```
@ViewChild(AngularGoogleMapsComponent) mapsComponent: AngularGoogleMapsComponent
```

Create map by providing focusLocation which will display the location from given coordinates 
and markerLocation which will place marker at the given coordinates:
```
this.mapsComponent.setUpMap(focusLocation, markerLocation)
```

Create map by providing only focusLocation and no markerLocation in order not to display marker:
```
this.mapsComponent.setUpMap(focusLocation, [])
```
## License
[MIT](https://choosealicense.com/licenses/mit/)
