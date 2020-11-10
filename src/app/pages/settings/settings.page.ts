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

import {Component} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {SettingsService, Settings} from '../../services/settings/settings.service';
import {ApiService, Trigger} from '../../services/api/api.service';
import {BufferedLocation, BufferService} from '../../services/buffer/buffer.service';
import {BackgroundGeolocationConfig} from '@ionic-native/background-geolocation';
import {BackgroundGeolocation} from '@ionic-native/background-geolocation/ngx';
import {LogProvider} from 'ionic-log-file-appender';

@Component({
    selector: 'settings-page',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
})
export class SettingsPage {

    public settings: Settings;
    public appName: string;
    public packageName: string;
    public appVersionNumber: string;
    public bufferSize: number;
    public locationConfig: BackgroundGeolocationConfig;

    constructor(public appVersion: AppVersion,
                public modalController: ModalController,
                public settingsService: SettingsService,
                public apiService: ApiService,
                public bufferService: BufferService,
                public backgroundGeolocation: BackgroundGeolocation,
                private log: LogProvider) {
        this.settingsService.getSettings().then((settings: Settings) => {
            this.settings = settings;
        });
        this.appVersion.getAppName().then((value: string) => {
            this.appName = value;
        });
        this.appVersion.getPackageName().then((value: string) => {
            this.packageName = value;
        });
        this.appVersion.getVersionNumber().then((value: string) => {
            this.appVersionNumber = value;
        });
        this.bufferService.getBuffer().then((buffer: BufferedLocation[]) => {
            this.bufferSize = buffer ? buffer.length : 0;
        });
        this.backgroundGeolocation.getConfig().then((config: BackgroundGeolocationConfig) => {
            this.locationConfig = config;
        });

    }

    seeLogFile() {
        this.log.getLogFiles()
            .then((files: any[]) => {
                alert(files[0].nativeURL);
            })
            .catch(err => {
                alert(err);
            });
    }

    dismissModal() {
        this.settingsService.setSettings(this.settings).then(() => {
            // Push user modifications
            if (this.apiService.lastLocation) {
                this.apiService.sendLocation(this.apiService.lastLocation, Trigger.UPDATE);
            }
            this.modalController.dismiss();
        });
    }
}
