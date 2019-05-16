// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import { getTestBed } from '@angular/core/testing'
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing'
import 'core-js/es7/reflect'
import 'zone.js/dist/zone'
import 'zone.js/dist/zone-testing'

declare const require: any

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())

const context = require.context('./', true, /\.spec\.ts$/)
context.keys().map(context)
