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


import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule, AlertController, Platform, ModalController, ToastController} from '@ionic/angular';

import {HomePage} from './home.page';
import {BackgroundGeolocation} from '@awesome-cordova-plugins/background-geolocation/ngx';
import {DeviceOrientation} from '@awesome-cordova-plugins/device-orientation/ngx';
import {ApiService} from '../../services/api/api.service';
import {SettingsService} from '../../services/settings/settings.service';
import {LogsService} from '../../services/logs/logs.service';


describe('HomePage', () => {
    let component: HomePage;
    let fixture: ComponentFixture<HomePage>;
    let deviceOrientationSpy, backgroundGeolocationSpy, alertControllerSpy, modalControllerSpy, settingsServiceSpy, apiServiceSpy, logsSpy;


    beforeEach(async(() => {
        deviceOrientationSpy = jasmine.createSpyObj('DeviceOrientation', ['watchHeading']);
        backgroundGeolocationSpy = jasmine.createSpyObj('BackgroundGeolocation', ['configure', 'start']);
        alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
        modalControllerSpy = jasmine.createSpyObj('ModalController', ['create']);
        settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['initSettings', 'getSettings', 'setSettings']);
        apiServiceSpy = jasmine.createSpyObj('ApiService', ['create']);
        logsSpy = jasmine.createSpyObj('LogsService', ['create']);

        TestBed.configureTestingModule({
            declarations: [HomePage],
            imports: [IonicModule.forRoot()],
            providers: [
                {provide: DeviceOrientation, useValue: deviceOrientationSpy},
                {provide: BackgroundGeolocation, useValue: backgroundGeolocationSpy},
                {provide: AlertController, useValue: alertControllerSpy},
                {provide: ModalController, useValue: modalControllerSpy},
                {provide: SettingsService, useValue: settingsServiceSpy},
                {provide: ApiService, useValue: apiServiceSpy},
                {provide: LogsService, useValue: logsSpy},
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HomePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });
});
