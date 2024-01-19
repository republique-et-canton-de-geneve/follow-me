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

import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {AlertController, ModalController, Platform, ToastController} from '@ionic/angular';
import {DeviceOrientation, DeviceOrientationCompassHeading} from '@awesome-cordova-plugins/device-orientation/ngx';
import {
    BackgroundGeolocation,
    BackgroundGeolocationAuthorizationStatus,
    BackgroundGeolocationEvents, BackgroundGeolocationLocationProvider,
    BackgroundGeolocationResponse
} from '@awesome-cordova-plugins/background-geolocation/ngx';
import {SettingsPage} from '../settings/settings.page';
import {ApiService} from '../../services/api/api.service';
import {Settings, SettingsService} from '../../services/settings/settings.service';
import {LogsService} from '../../services/logs/logs.service';


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})


export class HomePage implements AfterViewInit {

    // COMPASS
    private static readonly COMPASS_FREQUENCY = 50;
    private static readonly DIRECTION_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    private static readonly FULL_CIRCLE = 360;
    private static readonly SIXTEEN = 16;
    private static readonly EIGHT = 8;
    private static readonly SIXTEENTH = HomePage.FULL_CIRCLE / HomePage.SIXTEEN;
    private static readonly EIGHTH = HomePage.FULL_CIRCLE / HomePage.EIGHT;

    // GPS
    private static readonly COORDS_DECIMALS = 6;
    private static readonly ACCURACY_MEDIUM = 10;
    private static readonly ACCURACY_LOW = 20;


    @ViewChild('compass', {static: false}) compass: ElementRef;
    public magneticHeading = 0;
    public recording = false;
    public displayLogs = false;
    public logs = [];
    private processingLocation = false;

    // App settings modal
    async presentSettings() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }

    // Device settings alert
    async settingsAlertConfirm() {
        const alert = await this.alertController.create({
            header: 'Localisation',
            message: 'La localisation semble désactivée dans les réglages de l\'appareil, veuillez l\'activer.',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Réglages',
                    handler: () => {
                        this.backgroundGeolocation.showAppSettings();
                    }
                }
            ]
        });

        await alert.present();
    }

    constructor(private readonly deviceOrientation: DeviceOrientation,
                private readonly backgroundGeolocation: BackgroundGeolocation,
                private readonly alertController: AlertController,
                public modalController: ModalController,
                public settingsService: SettingsService,
                public apiService: ApiService,
                public logsService: LogsService) {
    }

    ngAfterViewInit() {
    }

    ionViewDidEnter() {
        console.log('ionViewDidEnter HomePage');
        this.deviceOrientation.watchHeading({frequency: HomePage.COMPASS_FREQUENCY}).subscribe(
            {
                next: (data: DeviceOrientationCompassHeading) => {
                    this.magneticHeading = data.magneticHeading;
                },
                error: err => console.error(`DeviceOrientation error value: ${err}`),
                complete: () => console.log(`DeviceOrientation complete notification`)
            }
        );

        this.configureGeolocation().then(() => {
            if (this.settingsService.settingsPopulated) {
                this.backgroundGeolocation.start();
                this.logsService.addLog('Starting geolocation service');
                this.recording = true;
                this.enableBackgroundMode(true);
            } else {
                this.backgroundGeolocation.checkStatus().then((status) => {
                    this.recording = status.isRunning;
                    this.enableBackgroundMode(this.recording);
                });
            }
        });
    }

    async configureGeolocation() {
        const settings: Settings = await this.settingsService.getSettings();
        console.log('Configure with :');
        console.log(settings.backgroundGeolocationConfig);
        this.backgroundGeolocation.configure(settings.backgroundGeolocationConfig)
            .then(() => {

                this.backgroundGeolocation.on(BackgroundGeolocationEvents.location).subscribe({
                        next: (location: BackgroundGeolocationResponse) => {
                            this.logsService.addLog(
                                `New location (lat :${location.latitude},
                                 lng:${location.longitude},
                                 speed:${location.speed},
                                 accuracy: ${location.accuracy}`
                            );
                            this.backgroundGeolocation.finish(); // FOR IOS ONLY
                            this.backgroundGeolocation.startTask().then((taskKey: number) => {
                                if (this.processingLocation) {
                                    return;
                                }
                                this.processingLocation = true;
                                location.bearing = this.magneticHeading;
                                this.apiService.validLocation(location).then(([valid, trigger, correctLocation]) => {
                                    if (valid) {
                                        this.logsService.addLog('Location is valid, send it');
                                        this.apiService.sendLocation(correctLocation, trigger).finally(() => {
                                            this.processingLocation = false;
                                            this.checkConfiguration();
                                            this.backgroundGeolocation.endTask(taskKey);
                                        });
                                    } else {
                                        this.logsService.addLog('Location is invalid');
                                        this.checkConfiguration();
                                        this.backgroundGeolocation.endTask(taskKey);
                                        this.processingLocation = false;
                                    }
                                });
                            });
                        },
                        error: err => console.error(`BackgroundGeolocation error value: ${err}`),
                        complete: () => console.log(`BackgroundGeolocation complete notification`)
                    }
                );

            });
    }


    async checkConfiguration() {
        await this.logsService.addLog('Checking eco mode...');
        const settings: Settings = await this.settingsService.getSettings();
        const lvl = this.apiService.lastBatteryStatus ? this.apiService.lastBatteryStatus.level : -1;
        if (lvl < 1) {
            return;
        }
        if (!settings.ecoMode) {
            await this.logsService.addLog('Eco mode is disabled');
            return;
        }
        if (lvl < settings.ecoMax) {
            await this.logsService.addLog(`Battery level (${lvl}) is under MAX, disable GPS and HTTP`);
            await this.backgroundGeolocation.stop();
            await this.logsService.addLog('Stop geolocation service');
            this.recording = false;
            return;
        }

        if (lvl < settings.ecoInter) {
            await this.logsService.addLog(`Battery level (${lvl}) is under INTER, limit GPS refresh rate`);
            await this.backgroundGeolocation.configure({locationProvider: BackgroundGeolocationLocationProvider.DISTANCE_FILTER_PROVIDER});
            await this.logsService.addLog('Switch to limited GPS');
            return;
        }
    }

    direction() {
        const index: number = (this.magneticHeading + HomePage.SIXTEENTH > HomePage.FULL_CIRCLE) ? 0 : this.magneticHeading + HomePage.SIXTEENTH;
        return HomePage.DIRECTION_LABELS[Math.floor(index / HomePage.EIGHTH)];
    }

    splitCoord(coord: number) {
        const splited = coord.toString().split('.');
        splited[1] = splited[1].substring(0, HomePage.COORDS_DECIMALS);
        return splited;
    }

    accuracyClass(accuracy: number) {
        if (accuracy > HomePage.ACCURACY_LOW) {
            return 'low';
        }
        if (accuracy > HomePage.ACCURACY_MEDIUM) {
            return 'medium';
        }
        return 'high';
    }

    switchRecord() {
        if (!this.recording) {
            this.backgroundGeolocation.start();
            this.logsService.addLog('Starting geolocation service');
            this.backgroundGeolocation.checkStatus().then((status) => {
                if (status.authorization === BackgroundGeolocationAuthorizationStatus.NOT_AUTHORIZED) {
                    this.backgroundGeolocation.stop();
                    this.logsService.addLog('Stop geolocation service');
                    this.recording = false;
                    this.settingsAlertConfirm();
                } else {
                    this.recording = true;
                }
                this.enableBackgroundMode(this.recording);
            });
        } else {
            this.backgroundGeolocation.stop();
            this.logsService.addLog('Stop geolocation service');
            this.recording = false;
            this.enableBackgroundMode(false);
        }
    }

    enableBackgroundMode(enable: boolean) {
        if (window['cordova']) {
            window['cordova'].plugins['backgroundMode'].setEnabled(enable);
        }
    }
}
