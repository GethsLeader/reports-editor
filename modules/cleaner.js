/* IMPORTS */

const fs = require('fs'),
    path = require('path');

module.exports = (expressApplication) => {
    setInterval(() => {
        fs.readdir(expressApplication.get('uploads path'), (error, files) => {
            if (error) {
                return console.error(error);
            }
            let ext = expressApplication.config.preparationExt;
            ext = ext.charAt(0) != '.' ? '.' + ext : ext;
            for (let i = 0; i < files.length; i++) {
                let extPos = files[i].indexOf(ext);
                if (extPos > 0 && files[i].length - ext.length == extPos) {
                    let filePath = path.join(expressApplication.get('uploads path'), files[i]);
                    fs.stat(filePath, (error, stats) => {
                        if (stats.birthtime.getTime() + expressApplication.config.timeToClean <= (new Date).getTime()) {
                            fs.unlink(filePath, (error) => {
                                if (error) {
                                    console.error(error);
                                }
                            });
                        }
                    });
                }
            }
        })
    }, expressApplication.config.cleanInterval);
};