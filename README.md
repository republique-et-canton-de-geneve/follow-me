![FollowMe](_README/header.png)
---
FollowMe is a **mobile real-time GPS tracking application** (smartphone only) able to geolocate the user outside and send its position to a Geomatic's REST service.  
FollowMe can run on iOS and Android smartphones and implements AppConfig standard (so can be manageable by various MDM).

# Table of contents

- [System overview](#system-overview)
    - [Real-time GPS tracking](#real-time-gps-tracking)
    - [Locations buffering](#locations-buffering)
    - [Battery saving mode](#battery-saving-mode)
    - [AppConfig implementation](#appconfig-implementation)
    - [Communication with the server](#communication-with-the-server)
    - [Logs](#logs)
- [Compiling and running](#compiling-and-running)
	- [Preconditions](#preconditions)
	- [Project setup](#project-setup)
	- [Code quality](#code-quality)
	- [Compiling](#compiling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Licence](#licence)

# System overview

FollowMe includes following features :
* Real-time GPS tracking
* Locations buffering
* Battery saving mode
* AppConfig implementation
* Communication with the server
* Logs

## Real-time GPS tracking
Device location is recorded only with the GPS chipset in foreground and in background. The tracking can be deactivated by a switch on the main screen. 
In order to limit request and useless computation, the app filter each point received from the device chipset, by applying rules defined in settings (interval / distance).

## Locations buffering
App send GPS point to the server on each tick. If the device can't reach the server, locations are stored in a sqlite local database until the connectivity is recovered. 

## Battery saving mode
The battery saving mode is enabled by default and can be disabled in settings. Eco mode's behavior is based on 2 battery's levels (inter / max) defined in settings.
 :
 * If the battery level is below intermediate level : the GPS tracking will be less aggressive (depending on device capabilities) 
 * If the battery level is below max level : the GPS tracking is automatically stopped and the app don't send GPS location anymore

## AppConfig implementation
In the current version, the app tries to get 2 variables from the MDM environment :
* `disclaimer` (`String`) : content displayed on the first launch or when the disclaimer is updated
* `baseUrl` (`String`) : REST API endpoint called by the application to send GPS locations

**@see** [AppConfig.org](https://www.appconfig.org/) for more information.

## Communication with the server
The app send POST request to the `baseUrl` defined in the settings. Please find below parameters constituting the JSON object sent to the server :
| Parameter                 | Type              | Description                                                                                                                                                                                                        |
|---------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `TIMESTAMP`               | `Number`          | Location timestamp, in ms.                                                                                                                                                                                         |
| `LONGITUDE`               | `Number`          | Longitude, in deg.                                                                                                                                                                                                 | 
| `LATITUDE        `        | `Number`          | Latitude, in deg.                                                                                                                                                                                                  |
| `ACCURACY`                | `Number`          | Estimated accuracy of this location, in m. **@see** [Android docs](https://developer.android.com/reference/android/location/Location#getAccuracy()) for more information. (docs for value on iOS devices is missing)  | 
| `BEARING`                 | `Number`          | Bearing, in deg.                                                                                                                                                                                                   |
| `BATTERY`                 | `Number`          | Battery level, in %.                                                                                                                                                                                               |
| `SPEED`                   | `Number`          | Speed, in m/s.                                                                                                                                                                                                     |
| `UUID`                    | `String`          | Device's Universally Unique Identifier (UUID). **@see** [Android docs](https://developer.android.com/reference/android/provider/Settings.Secure#ANDROID_ID) and [iOS docs](https://developer.apple.com/documentation/uikit/uidevice/1620059-identifierforvendor?language=objc) for more information.                                                                                                                                                                     |
| `SIM`                     | `String`          | SIM number (only available on Android).                                                                                                                                                                            |
| `VEHICLE_TYPE`            | `String`          | Custom string defined in settings.                                                                                                                                                                                 |
| `TRIGGER`                 | `String`          | HTPP POST can be trigger by settings update (`UPDATE`), a new location (`MOVE`) or a custom interval (`SLEEP`)                                                                                                     |
| `SENDING_INTERVAL`        | `Number`          | If there is no new GPS point between this custom interval, app send the last point. In s.                                                                                                                          |
| `SENDING_DISTANCE`        | `Number`          | Minimum distance travelled by the user since the last point to record the GPS point. In m.                                                                                                                         |
| `MODE_ECO`                | `Boolean`         | Eco mode enabled/disabled.                                                                                                                                                                                         |
| `SEUIL_LIMITE_INTER`      | `Number`          | Eco mode inter level, in %.                                                                                                                                                                                        |
| `SEUIL_LIMITE_MAX`        | `Number`          | Eco mode max level, in %.                                                                                                                                                                                          |

## Logs
All locations, computations, settings modifications, tacking activation / deactivation are logged in local file. Path of current local file can be displayed by clicking on app version on settings screen.
Log system limit file size to 1MB and global logs size to 5MB.

# Compiling and running

## Preconditions
The following software must be installed to compile and run the application :
* Node 10
* NPM 6

## Project setup
Prepare the application (Ionic + Cordova + all dev dependencies) with NPM :
```Shell
npm install -g @ionic/cli
npm install -g cordova@9
npm install
```
*More info on Ionic can be found on the [Installing Ionic
](https://ionicframework.com/docs/intro/cli) page and the [Ionic CLI](https://github.com/driftyco/ionic-cli) repo.*

## Code quality
To run tests and generate code-coverage, use:
```Shell
npm run test
```

To send code-coverage to Sonar, fill `sonar-project.properties` file and use:
```Shell
sonar-scanner
```

## Compiling
### Android
Tested with :
* Android Studio 3.5.1

To package the Android app, first use:
```Shell
npm run prepare-android
```
You are ready to build the apk:
```Shell
ionic cordova build android --prod
```
Package is now available at : `platforms/android/app/build/outputs/apk/debug/app-debug.apk`
To export signed apk, you can use Android Studio and open `platforms/android/` folder.

### iOS
Tested with :
* Xcode 12

To package the iOS app (on MacOS environment only), use:
```Shell
ionic cordova platform add ios
ionic cordova build ios --prod
```
Package is now available at : `platforms/ios/build/emulator/FollowMe.app`
To export signed ipa, you can use Xcode and open `platforms/ios/FollowMe.xcworkspace` project.

# Troubleshooting
#### GPS tracking on Android
Some Android vendors (e.g. Xiaomi, Huawei, OnePlus or even Samsung…) implements their own battery savers with side effects on background activity of third-party apps like FollowMe. **@see** [DontKillMyApp](https://dontkillmyapp.com/problem).  
Luckily there are different workarounds for many platforms, described [here](https://dontkillmyapp.com/?app=FollowMe).

# Contributing
If you want to submit a contribution to this project, simply fork it on GitHub and submit your pull request. We will be glad to review it!

# Licence
FollowMe application is released under [AGPL 3.0](https://www.gnu.org/licenses/agpl.txt).
