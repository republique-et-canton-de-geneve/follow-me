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
import {BackgroundGeolocationResponse} from "@ionic-native/background-geolocation/ngx";
import {Trigger} from "../api/api.service";

export interface BufferedLocation {
    timestamp: number;
    location: BackgroundGeolocationResponse;
    trigger: Trigger;
    httpError: any;
}

@Injectable()
export class BufferService {

    private static readonly BUFFER_STORAGE_KEY = 'buffer';

    constructor(public storage: Storage) {
    }

    async addLocation(alocation: BackgroundGeolocationResponse, ahttpError: any, atrigger: Trigger) {
        const bufferedLocation: BufferedLocation = {location: alocation, httpError: ahttpError, timestamp: new Date().getTime(), trigger: atrigger};
        let buffer: BufferedLocation[] = await this.storage.get(BufferService.BUFFER_STORAGE_KEY);
        if (buffer) {
            buffer.push(bufferedLocation);
        } else {
            buffer = [bufferedLocation];
        }
        await this.setBuffer(buffer);
    }

    setBuffer(buffer: BufferedLocation[]) {
        console.log('setBuffer()');
        console.log(buffer);
        return this.storage.set(BufferService.BUFFER_STORAGE_KEY, buffer);
    }

    getBuffer() {
        return this.storage.get(BufferService.BUFFER_STORAGE_KEY);
    }

    async removeLocation(timestamp: number) {
        console.log('removeLocation() ' + timestamp.toString());
        const buffer: BufferedLocation[] = await this.storage.get(BufferService.BUFFER_STORAGE_KEY);
        if (buffer) {
            let index = -1;
            for (let i = 0; i < buffer.length; i++) {
                const bufferedLocation: BufferedLocation = buffer[i];
                if (bufferedLocation.timestamp === timestamp) {
                    index = i;
                }
            }
            buffer.splice(index, 1);
            await this.setBuffer(buffer);
        }

    }

}
