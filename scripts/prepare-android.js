#!/usr/bin/env node
'use strict';

const {exec} = require("child_process");
const fs = require('fs')


const uninstallBg = function () {
    exec("ionic cordova plugin rm cordova-plugin-background-geolocation && ionic cordova plugin rm cordova-plugin-background-mode", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        reinstallBg();
    });
}

const reinstallBg = function () {
    exec("ionic cordova plugin add @mauron85/cordova-plugin-background-geolocation && ionic cordova plugin add cordova-plugin-background-mode", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        fixFilesBg();
    });
}

const fixFilesBg = function () {
    fs.readFile('./plugins/cordova-plugin-background-geolocation/plugin.xml', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/android:name="com.marianhello.bgloc.service.LocationServiceImpl"/g, 'android:foregroundServiceType="location" android:name="com.marianhello.bgloc.service.LocationServiceImpl"');

        fs.writeFile('./plugins/cordova-plugin-background-geolocation/plugin.xml', result, 'utf8', function (err) {
            if (err) return console.log(err);
            fixFilesBgMode();
        });
    });
}

const fixFilesBgMode = function () {
    fs.readFile('./plugins/cordova-plugin-background-mode/plugin.xml', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/android:name="de.appplant.cordova.plugin.background.ForegroundService"/g, 'android:foregroundServiceType="location" android:name="de.appplant.cordova.plugin.background.ForegroundService"');

        fs.writeFile('./plugins/cordova-plugin-background-mode/plugin.xml', result, 'utf8', function (err) {
            if (err) return console.log(err);
            resetPlatform();
        });
    });
}

const resetPlatform = function() {
    exec("ionic cordova platform rm android && ionic cordova platform add android", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log("Platform Android successfully prepared !")
    });
}
uninstallBg();


