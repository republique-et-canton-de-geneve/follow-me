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

import {ModalController, Platform} from '@ionic/angular';
import {SplashScreen} from '@awesome-cordova-plugins/splash-screen/ngx';
import {StatusBar} from '@awesome-cordova-plugins/status-bar/ngx';
import {
    BackgroundGeolocation
} from '@awesome-cordova-plugins/background-geolocation/ngx';
import {TermsPage} from './pages/terms/terms.page';
import {SettingsService} from './services/settings/settings.service';
import {Router} from '@angular/router';
import {LogProvider} from "./libs/ionic-log-file-appender/log.service";
import { Storage } from '@ionic/storage-angular';


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {

    // Terms modal
    async presentTerms() {
        const modal = await this.modalController.create({
            component: TermsPage,
            backdropDismiss: false
        });
        modal.onDidDismiss().then(() => {
            this.settingsService.initSettings().then(() => {
                this.onTermsAccepted();
            });
        });
        return await modal.present();
    }

    constructor(
        private readonly platform: Platform,
        private readonly splashScreen: SplashScreen,
        private readonly statusBar: StatusBar,
        private readonly router: Router,
        private readonly modalController: ModalController,
        private readonly settingsService: SettingsService,
        private readonly window: Window,
        private readonly log: LogProvider,
        private readonly storage: Storage,
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.themeApp();
            this.splashScreen.hide();

            if (window['cordova']) {
                window['cordova'].plugins['backgroundMode'].enable();
                window['cordova'].plugins['backgroundMode'].disableBatteryOptimizations();
                window['cordova'].plugins['backgroundMode'].on('activate', () => {
                    window['cordova'].plugins['backgroundMode'].disableWebViewOptimizations();
                });
                this.log.init({});
            }

          this.storage.create().then(()=>{
            // Get settings to detect the first launch
            this.settingsService.getSettings().then(settings => {
              if (!settings || !settings.version || settings.version < SettingsService.CURRENT_VERSION) {
                this.presentTerms();
              } else {
                this.onTermsAccepted();
              }
            });
          });
        });
    }

    themeApp() {
        document.body.classList.toggle('dark', true);
        this.statusBar.styleDefault();
        if (this.platform.is('android')) {
            this.statusBar.overlaysWebView(true);
            this.statusBar.backgroundColorByHexString('33000000');
        }
    }

    onTermsAccepted() {
        // Init background geolocation
        this.settingsService.getSettings().then(settings => {
            this.settingsService.refreshEMMvalues();
            this.router.navigate(['/home']);
        });
    }
}
