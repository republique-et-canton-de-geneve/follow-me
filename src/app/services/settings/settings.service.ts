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

import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {environment} from '../../../environments/environment';
import {
    BackgroundGeolocation,
    BackgroundGeolocationAccuracy,
    BackgroundGeolocationConfig,
    BackgroundGeolocationLocationProvider
} from '@ionic-native/background-geolocation/ngx';
import {Sim} from '@ionic-native/sim/ngx';
import {Device} from '@ionic-native/device/ngx';
import {EmmAppConfig} from '@ionic-native/emm-app-config/ngx';
import {Platform} from '@ionic/angular';


export interface Settings {
    version: number;
    baseUrl: string;
    idUnique: string;
    uuid: string;
    backgroundGeolocationConfig: BackgroundGeolocationConfig;
    sendingInterval: number;
    sendingDistance: number;
    ecoMode: boolean;
    ecoInter: number;
    ecoMax: number;
    disclaimer?: string;

    baseUrlReadonly: boolean;
    idUniqueReadonly: boolean;
    uuidReadonly: boolean;
	ecoMaxReadonly: boolean;
	ecoInterReadonly: boolean;
	sendingIntervalReadonly: boolean;
	sendingDistanceReadonly: boolean;
}

@Injectable()
export class SettingsService {

    private static readonly SETTINGS_STORAGE_KEY = 'settings';
    private static readonly DEFAULT_SENDING_INTERVAL = 900;
    private static readonly DEFAULT_SENDING_DISTANCE = 5;
    public static readonly CURRENT_VERSION = 3;
    public settingsPopulated = false;

    constructor(public storage: Storage,
                private readonly sim: Sim,
                private readonly device: Device,
                private readonly platform: Platform,
                private readonly emmAppConfig: EmmAppConfig) {

        this.platform.ready().then(() => {
            this.emmAppConfig.registerChangedListener()
                .subscribe(() => {
                        this.refreshEMMvalues();
                    }
                );
        });
    }

    initSettings() {
        const settings: Settings = {
            version: SettingsService.CURRENT_VERSION,
            baseUrl: environment.apiEndpoint,
            idUnique: '',
            uuid: this.device.uuid,
            ecoMode: true,
            ecoMax: 10,
            ecoInter: 20,
            backgroundGeolocationConfig: {
                locationProvider: BackgroundGeolocationLocationProvider.RAW_PROVIDER,
                interval: 2000,
                fastestInterval: 1000,
                desiredAccuracy: 0,
                stationaryRadius: 1,
                distanceFilter: 1,
                stopOnTerminate: false, // enable this to clear background location settings when the app terminates
                maxLocations: 0,
            },
            sendingInterval: SettingsService.DEFAULT_SENDING_INTERVAL,
            sendingDistance: SettingsService.DEFAULT_SENDING_DISTANCE,
            disclaimer: environment.defaultDisclaimer,
			baseUrlReadonly: false,
			idUniqueReadonly: false,
			uuidReadonly: false,
			ecoMaxReadonly: false,
			ecoInterReadonly: false,
			sendingIntervalReadonly: false,
			sendingDistanceReadonly: false
        };
        this.settingsPopulated = true;
		return this.setSettings(settings);
    }

    refreshEMMvalues() {
        const baseUrl = this.emmAppConfig.getValue('baseUrl');
        const disclaimer = this.emmAppConfig.getValue('disclaimer');
        const idUnique = this.emmAppConfig.getValue('idUnique');
        const uuid = this.emmAppConfig.getValue("uuid");
        const ecoMax = this.emmAppConfig.getValue("ecoMax");
        const ecoInter = this.emmAppConfig.getValue("ecoInter");
        const sendingInterval = this.emmAppConfig.getValue("sendingInterval");
        const sendingDistance = this.emmAppConfig.getValue("sendingDistance");
        let change = false;
        this.getSettings().then((settings: Settings) => {
            if (baseUrl && settings.baseUrl !== baseUrl) {
                settings.baseUrl = baseUrl;
                change = true;
				if(baseUrl !== '') {
					settings.baseUrlReadonly = true;
				}
            }
            if (idUnique && settings.idUnique !== idUnique) {
                settings.idUnique = idUnique;
                change = true;
				if(idUnique !== '') {
					settings.idUniqueReadonly = true;
				}
            }
            if (uuid && settings.uuid !== uuid) {
                settings.uuid = uuid;
                change = true;
				if(uuid !== '') {
					settings.uuidReadonly = true;
				}
            }
            if (ecoMax && settings.ecoMax !== ecoMax) {
                settings.ecoMax = ecoMax;
                change = true;
				if(ecoMax !== '') {
					settings.ecoMaxReadonly = true;
				}
            }
            if (ecoInter && settings.ecoInter !== ecoInter) {
                settings.ecoInter = ecoInter;
                change = true;
				if(ecoInter !== '') {
					settings.ecoInterReadonly = true;
				}
            }
            if (sendingInterval && settings.sendingInterval !== sendingInterval) {
                settings.sendingInterval = sendingInterval;
                change = true;
				if(sendingInterval !== '') {
					settings.sendingIntervalReadonly = true;
				}
            }
            if (sendingDistance && settings.sendingDistance !== sendingDistance) {
                settings.sendingDistance = sendingDistance;
                change = true;
				if(sendingDistance !== '') {
					settings.sendingDistanceReadonly = true;
				}
            }
            if (disclaimer && settings.disclaimer !== disclaimer) {
                settings.disclaimer = disclaimer;
                change = true;
            }

            if (change) {
                settings.version++;
                this.setSettings(settings);
            }
        });
    }

    getDisclaimer(): string {
        const disclaimer = this.emmAppConfig.getValue('disclaimer');
        return disclaimer ? disclaimer : environment.defaultDisclaimer;
    }

    getSettings() {
        return this.storage.get(SettingsService.SETTINGS_STORAGE_KEY);
    }

    setSettings(settings: Settings) {
        return this.storage.set(SettingsService.SETTINGS_STORAGE_KEY, settings);
    }
}
