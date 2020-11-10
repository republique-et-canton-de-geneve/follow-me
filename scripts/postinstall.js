#!/usr/bin/env node
'use strict';

var fs = require('fs')
fs.readFile('./node_modules/ionic-log-file-appender/log.service.d.ts', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace(/ionic-angular/g, '@ionic/angular').replace(/@ionic-native\/file'/g, '@ionic-native/file/ngx\'');

    fs.writeFile('./node_modules/ionic-log-file-appender/log.service.d.ts', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});

fs.readFile('./node_modules/ionic-log-file-appender/fesm2015/ionic-log-file-appender.js', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    var result = data.replace(/ionic-angular/g, '@ionic/angular').replace(/@ionic-native\/file'/g, '@ionic-native/file/ngx\'');

    fs.writeFile('./node_modules/ionic-log-file-appender/fesm2015/ionic-log-file-appender.js', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});
