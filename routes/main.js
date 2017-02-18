"use strict";

/* IMPORTS */

const path = require('path');
const fs = require('fs');

/* ROUTES */

function getIndex(expressApplication) {
    let timeToClean = Math.ceil(expressApplication.config.timeToClean / 1000 / 60 / 60);
    return function (req, res) {
        res.render('index', {
            title: null,
            layoutPath: 'layouts/default',
            timeToClean: timeToClean < 1 ? 1 : timeToClean
        });
    }
}

function getFile(expressApplication) {
    return function (req, res, next) {
        let id = req.params.id;
        if (id) {
            let filePath = path.join(expressApplication.get('uploads path'), id + '.xlsx');
            if (fs.existsSync(filePath)) {
                let status = fs.statSync(filePath),
                    fileBirthTime = status.birthtime.getTime(),
                    nowTime = Date.now(),
                    timeLimit = 1000 * 60 * 60 * 24;
                if (fileBirthTime + timeLimit > nowTime) {
                    res.download(filePath, 'converted.xlsx');
                } else {
                    fs.unlinkSync(filePath);
                    next();
                }
            } else {
                next();
            }
        } else {
            next();
        }
    }
}

function convertFile(expressApplication) {
    return function (req, res) {
        const Parser = require(path.join(expressApplication.get('path'), 'modules', 'reports-parser')).Parser;
        let parser = new Parser(),
            errors = [],
            file, newFile;
        (new Promise((resolve, reject) => {
            if (req.file) {
                file = req.file.path;
                if (expressApplication.config.allowed2UploadTypes.indexOf(req.file.mimetype) < 0) {
                    errors.push('wrong_file_type');
                }
                if (expressApplication.config.allowed2UploadExtensions.indexOf(path.extname(req.file.originalname)) < 0) {
                    errors.push('wrong_file_extension');
                }
                if (errors.length == 0) {
                    let cmd = expressApplication.config.preparationCmd,
                        ext = expressApplication.config.preparationExt.replace('.', ''),
                        params = [ext, file, expressApplication.get('uploads path')];
                    for (let i = 0; i < params.length; i++) {
                        cmd = cmd.replace('$' + i, params[i]);
                    }
                    parser.prepareFile(file, {
                        prepareCmd: cmd,
                        prepareExt: ext,
                        fileInCmd: false,
                        prepareTimeout: 5000
                    })
                        .then((result) => {
                            newFile = result;
                            try {
                                parser.openFile(newFile);
                            } catch (error) {
                                console.error(error);
                                if (error.message == 'Fatal error! Incoming data size is wrong.') {
                                    errors.push('wrong_data_size');
                                } else {
                                    errors.push('opening_crash');
                                }
                            }
                            try {
                                if (!parser.editPhones()) {
                                    errors.push('phones_not_edited');
                                }
                                if (!parser.editNames()) {
                                    errors.push('names_not_edited');
                                }
                                if (!parser.editDates()) {
                                    errors.push('dates_not_edited');
                                }
                            } catch (error) {
                                console.error(error);
                                errors.push('editing_crash');
                            }
                            parser.saveFile(newFile);
                            return resolve(true);
                        })
                        .catch((error) => {
                            console.error(error);
                            errors.push('prepare_crash');
                            return resolve(false);
                        });
                } else {
                    return resolve(false);
                }
            } else {
                errors.push('file_not_loaded');
                return resolve(false);
            }
        }))
            .catch((error) => {
                console.error(error);
            })
            .then(() => {
                parser.closeFile();
                parser = null;
                fs.unlink(file, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
                if (errors.length && newFile) {
                    fs.unlink(newFile, (error) => {
                        if (error) {
                            console.error(error);
                        }
                    });
                }
                return res.render('converted', {
                    title: 'converted', layoutPath: 'layouts/default', errors: errors,
                    id: req.file.filename
                });
            })
            .catch((error) => {
                throw error;
            });
    }
}

/* EXPORTS */

module.exports = function (expressApplication) {
    expressApplication.get('/', getIndex(expressApplication));
    expressApplication.get('/file/:id', getFile(expressApplication));
    expressApplication.post('/convert', expressApplication.uploader.single('tablefile'), convertFile(expressApplication));
};