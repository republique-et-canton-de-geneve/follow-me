/*
 * FollowMe
 *
 * Copyright (C) 2020 République et canton de Genève
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TestBed, async} from '@angular/core/testing';

import {ModalController, Platform} from '@ionic/angular';
import {SplashScreen} from '@awesome-cordova-plugins/splash-screen/ngx';
import {StatusBar} from '@awesome-cordova-plugins/status-bar/ngx';

import {AppComponent} from './app.component';
import {BackgroundGeolocation} from '@awesome-cordova-plugins/background-geolocation/ngx';
import {Router} from "@angular/router";
import {SettingsService} from "./services/settings/settings.service";

describe('AppComponent', () => {

    let statusBarSpy, splashScreenSpy, backgroundGeolocationSpy, platformIsSpy, platformReadySpy, platformSpy, routerSpy, modalControllerSpy, settingsServiceSpy;

    beforeEach(async(() => {
        statusBarSpy = jasmine.createSpyObj('StatusBar', ['styleDefault', 'overlaysWebView', 'backgroundColorByHexString']);
        splashScreenSpy = jasmine.createSpyObj('SplashScreen', ['hide']);
        backgroundGeolocationSpy = jasmine.createSpyObj('BackgroundGeolocation', ['configure']);
        platformReadySpy = Promise.resolve();
        platformIsSpy = true;
        platformSpy = jasmine.createSpyObj('Platform', {
            ready: platformReadySpy, is: platformIsSpy
        });
        routerSpy = jasmine.createSpyObj('Router', ['create']);
        modalControllerSpy = jasmine.createSpyObj('ModalController', ['create']);
        settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['create']);

        TestBed.configureTestingModule({
            declarations: [AppComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                {provide: Platform, useValue: platformSpy},
                {provide: SplashScreen, useValue: splashScreenSpy},
                {provide: StatusBar, useValue: statusBarSpy},
                {provide: BackgroundGeolocation, useValue: backgroundGeolocationSpy},
                {provide: Router, useValue: routerSpy},
                {provide: ModalController, useValue: modalControllerSpy},
                {provide: SettingsService, useValue: settingsServiceSpy},
            ],
        }).compileComponents();
    }));

    it('should be running', () => {
        expect(true).toBeTruthy();
    });

    /*it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    it('should initialize the app', async () => {
        TestBed.createComponent(AppComponent);
        expect(platformSpy.ready).toHaveBeenCalled();
        await platformReadySpy;
        expect(statusBarSpy.styleDefault).toHaveBeenCalled();
        // expect(splashScreenSpy.hide).toHaveBeenCalled();
        // expect(backgroundGeolocationSpy.configure).toHaveBeenCalled();
    });*/

    // TODO: add more tests!

});
