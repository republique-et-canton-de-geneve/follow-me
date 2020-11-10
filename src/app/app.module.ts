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

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy, Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {DeviceOrientation} from '@ionic-native/device-orientation/ngx';
import {BackgroundGeolocation} from '@ionic-native/background-geolocation/ngx';
import {BatteryStatus} from '@ionic-native/battery-status/ngx';
import {IonicStorageModule} from '@ionic/storage';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {Sim} from '@ionic-native/sim/ngx';
import {Device} from '@ionic-native/device/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {TermsPage} from './pages/terms/terms.page';
import {SettingsService} from './services/settings/settings.service';
import {ApiService} from './services/api/api.service';
import {BufferService} from './services/buffer/buffer.service';
import {LogsService} from './services/logs/logs.service';
import {DatePipe} from '@angular/common';
import {LogProvider, LogFileAppenderModule} from 'ionic-log-file-appender';
import {EmmAppConfig} from '@ionic-native/emm-app-config/ngx';
import {File} from '@ionic-native/file/ngx';

@NgModule({
    declarations: [AppComponent, TermsPage],
    entryComponents: [TermsPage],
    providers: [
        File,
        StatusBar,
        SplashScreen,
        DeviceOrientation,
        BackgroundGeolocation,
        BatteryStatus,
        AppVersion,
        Sim,
        Device,
        HTTP,
        EmmAppConfig,
        DatePipe,
        LogProvider,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        SettingsService,
        ApiService,
        BufferService,
        LogsService,
        {provide: Window, useValue: window}
    ],
    imports: [BrowserModule, IonicModule.forRoot(), IonicStorageModule.forRoot({
        name: 'followme',
        driverOrder: ['sqlite', 'indexeddb', 'websql']
    }),
        LogFileAppenderModule.forRoot(), AppRoutingModule],
    bootstrap: [AppComponent]
})
export class AppModule {
}
