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
import {Settings, SettingsService} from '../settings/settings.service';
import {HTTP, HTTPResponse} from '@awesome-cordova-plugins/http/ngx';
import {BackgroundGeolocationResponse} from '@awesome-cordova-plugins/background-geolocation/ngx';
import {BatteryStatus, BatteryStatusResponse} from '@awesome-cordova-plugins/battery-status/ngx';
import {ToastController} from '@ionic/angular';
import {BufferedLocation, BufferService} from '../buffer/buffer.service';
import {LogsService} from '../logs/logs.service';


interface ApiLocation {
    TIMESTAMP?: number;
    LONGITUDE?: number;
    LATITUDE?: number;
    ACCURACY?: number;
    BEARING?: number;
    BATTERY?: number;
    SPEED?: number;
    UUID?: string;
    ID_UNIQUE?: string;
    TRIGGER?: string;
    SENDING_INTERVAL?: number;
    SENDING_DISTANCE?: number;
    MODE_ECO?: boolean;
    SEUIL_LIMITE_INTER?: number;
    SEUIL_LIMITE_MAX?: number;
}

export enum Trigger {
    MOVE = 'MOVE',
    SLEEP = 'SLEEP',
    UPDATE = 'UPDATE'
}

@Injectable()
export class ApiService {

    private static readonly MILLISECONDS_IN_SECOND = 1000;
    private static readonly METERS_IN_KILOMETER = 1000;

    public lastLocation: BackgroundGeolocationResponse;
    public lastPostSuccess: number;
    public lastPostIsSuccess = false;

    public isSending = false;

    public lastBatteryStatus: BatteryStatusResponse;


    constructor(public readonly settingsService: SettingsService,
                private readonly http: HTTP,
                private batteryStatus: BatteryStatus,
                public toastController: ToastController,
                public bufferService: BufferService,
                public logsService: LogsService) {
        this.http.setDataSerializer('json');
        this.batteryStatus.onChange().subscribe((status: BatteryStatusResponse) => {
            this.lastBatteryStatus = status;
        });

    }

    async errorToast(error: string) {
        const toast = await this.toastController.create({
            message: error,
            duration: 2000,
            position: 'top'
        });
        toast.present();
    }

    async sendLocation(aLocation: BackgroundGeolocationResponse, trigger: Trigger): Promise<void> {
        await this.bufferService.addLocation(aLocation, {}, trigger);
        const buffer = await this.bufferService.getBuffer();
        if (!this.isSending) {
          await this.requestForLocation(buffer[0]);
        }
        return Promise.resolve();
    }

    async requestForLocation(bufferLocation : BufferedLocation) {
      const settings = await this.settingsService.getSettings();
      const request = this.http.post(settings.baseUrl, this.buildApiLocation(bufferLocation.location, bufferLocation.trigger, settings), {});
      this.isSending = true;
      request.then(data => {
        this.lastPostSuccess = new Date().getTime();
        this.lastPostIsSuccess = true;
        this.bufferService.removeLocation(bufferLocation.timestamp).then(()=>{
          this.bufferService.getBuffer().then((buffer: BufferedLocation[]) => {
            if (buffer && buffer.length > 0) {
              const bufferedLocation: BufferedLocation = buffer[0];
              this.requestForLocation(bufferedLocation);
            }else{
              this.isSending = false;
            }
          });
        });
      }).catch(error => {
        this.lastPostIsSuccess = false;
        this.isSending = false;
        this.errorToast(error.error);
        this.bufferService.removeLocation(bufferLocation.timestamp).then(()=>{
          // Store location if it's not a setting update
          if (bufferLocation.trigger !== Trigger.UPDATE) {
            this.bufferService.addLocation(bufferLocation.location, error, bufferLocation.trigger);
          }
        });
      });
    }

    async validLocation(aLocation: BackgroundGeolocationResponse): Promise<[boolean, Trigger, BackgroundGeolocationResponse]> {
        await this.logsService.addLog('Validating location...');
        const settings = await this.settingsService.getSettings();
        let valid;
        let trigger: Trigger;
        const correctLocation: BackgroundGeolocationResponse = aLocation;
        if (!this.lastLocation || this.lastLocation === undefined) {
            // Init with a valid location
            await this.logsService.addLog('First location, we send it without validation');
            valid = true;
            trigger = Trigger.UPDATE;
            correctLocation.speed = 0;
        } else {
            //  Distance check
            const dist = this.distanceInKm(aLocation.latitude, aLocation.longitude, this.lastLocation.latitude, this.lastLocation.longitude);
            await this.logsService.addLog(`Distance since last valid point : ${Math.round(dist * ApiService.METERS_IN_KILOMETER)} m`);
            valid = dist > settings.sendingDistance / ApiService.METERS_IN_KILOMETER;
            trigger = valid ? Trigger.MOVE : null;

            if (valid) {
                await this.logsService.addLog('Distance trigger request, compute correct speed');
                await this.logsService.addLog(`Initial speed : ${aLocation.speed}m/s
                | Corrected speed : ${this.correctSpeed(aLocation)}m/s`);
                correctLocation.speed = this.correctSpeed(aLocation);
            } else {
                // Time interval check
                await this.logsService.addLog('Insufficient distance, check time interval...');
                await this.logsService.addLog(`${Math.round((aLocation.time - this.lastLocation.time) / ApiService.MILLISECONDS_IN_SECOND)}s since last point recorded`);
                valid = aLocation.time - this.lastLocation.time > (settings.sendingInterval * ApiService.MILLISECONDS_IN_SECOND);
                trigger = valid ? Trigger.SLEEP : null;
                correctLocation.speed = 0;
            }
        }
        if (valid) {
            this.lastLocation = aLocation;
        }
        return Promise.resolve([valid, trigger, correctLocation]);
    }

    private buildApiLocation(aLocation: BackgroundGeolocationResponse, trigger: Trigger, settings: Settings): ApiLocation {
        const location: ApiLocation = {};
        location.TIMESTAMP = Math.round(aLocation.time);
        location.LONGITUDE = aLocation.longitude;
        location.LATITUDE = aLocation.latitude;
        location.ACCURACY = aLocation.accuracy;
        location.BEARING = aLocation.bearing;
        location.BATTERY = this.lastBatteryStatus ? this.lastBatteryStatus.level : -1;
        location.SPEED = aLocation.speed;
        location.ID_UNIQUE = settings.idUnique;
        location.UUID = settings.uuid;
        location.TRIGGER = trigger;
        location.SENDING_DISTANCE = settings.sendingDistance;
        location.SENDING_INTERVAL = settings.sendingInterval;
        location.MODE_ECO = settings.ecoMode;
        location.SEUIL_LIMITE_INTER = settings.ecoInter;
        location.SEUIL_LIMITE_MAX = settings.ecoMax;

        if (trigger === Trigger.UPDATE) {
            // Override time & speed
            location.SPEED = 0;
            location.TIMESTAMP = new Date().getTime();
        }
        return location;
    }

    private distanceInKm(lat1, lon1, lat2, lon2) {
        const p = 0.017453292519943295;    // Math.PI / 180
        const c = Math.cos;
        const a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    private correctSpeed(locationToCorrect: BackgroundGeolocationResponse): number {
        if (locationToCorrect.speed && locationToCorrect.speed !== undefined && locationToCorrect.speed > 0) {
            return locationToCorrect.speed;
        }
        // Invalid speed, calculating approx. speed
        const d = this.distanceInKm(locationToCorrect.latitude,
            locationToCorrect.longitude,
            this.lastLocation.latitude,
            this.lastLocation.longitude) * ApiService.METERS_IN_KILOMETER;
        const t = (locationToCorrect.time - this.lastLocation.time) / ApiService.MILLISECONDS_IN_SECOND;
        return d / t;
    }
}
