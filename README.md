# angular-google-maps
This library integrates Google Maps functionality to Angular framework. 

## Installation

Install using node package manager:
```
$ npm install @boldadmin/angular-google-maps
```

## Usage
Configure providers like the following in @NgModule anotation of app.module.ts file and replace YOUR_GOOGLE_MAPS_API_KEY with google maps api key:
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

Configure imports like the following in @NgModule annotation of module where you will be using angular-google-maps:
```
@NgModule({
    imports: [
        AngularGoogleMapsModule
    ]
})

```

Add the following element `<google-maps></google-maps>` to your html template where map should be displayed

Add AngularGoogleMapsComponent reference inside your module's component:
```
@ViewChild(AngularGoogleMapsComponent) mapsComponent: AngularGoogleMapsComponent
```

Create map by providing focusLocation which will display the location from given coordinates and markerLocation which will place marker at the given coordinates:
```
this.mapsComponent.setUpMap(focusLocation, markerLocation)
```

TODO: geocode info goes here
## License
[MIT](https://choosealicense.com/licenses/mit/)
