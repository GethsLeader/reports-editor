'use strict';

/* IMPORTS */

const xlsx = require('xlsx');
const fs = require('fs');
const child_process = require('child_process');

/* CLASSES */

class Parser {
    constructor() {
        this.file = null;
        this.workbook = null;
    }

    prepareFile(file, options) {
        if (!options) {
            options = {}
        }
        const prepareCmd = options.prepareCmd ? options.prepareCmd : null,
            fileInCmd = options.fileInCmd,
            prepareTimeout = options.prepareTimeout ? options.prepareTimeout : 3000;
        let newFile = file,
            prepareExt = options.prepareExt ? options.prepareExt : null;
        if (prepareExt) {
            prepareExt = prepareExt.charAt(0) != '.' ? '.' + prepareExt : prepareExt;
            newFile = file.indexOf('.') >= 0 ? file.replace(/\.[^.]+$/, prepareExt) : file + prepareExt;
        }
        return new Promise((resolve, reject) => {
            let args = prepareCmd.split(' ');
            for (let i = 0; i < args.length; i++) {
                args[i].trim();
                if (!args[i]) {
                    args.splice(i, 1);
                    i--;
                }
            }
            if (args.length == 0) {
                return reject(new Error('Fatal error! Cannot execute preparation command!'));
            }
            let cmd = args[0];
            args.splice(0, 1);
            if (fileInCmd) {
                args.push(newFile);
            }
            let preparator = child_process.spawn(cmd, args);
            preparator.on('error', (error) => {
                return reject(new Error('Fatal error! Cannot prepare file! (' + error.message + ')'));
            });

            preparator.stderr.on('data', (data) => {
                return reject(new Error('Fatal error! File preparation was terminated with error: ' + data));
            });

            preparator.on('exit', (code, signal) => {
                preparator = null;
                if (!code && signal) {
                    return reject(new Error('Fatal error! File preparation was surprisingly terminated!'));
                }
                return resolve(newFile);
            });
            setTimeout(() => {
                if (preparator) {
                    preparator.stdin.pause();
                    reject(new Error('Fatal error! File preparation was terminated because timeout!'));
                    return preparator.kill('SIGTERM');
                }
            }, prepareTimeout);
        });
    }

    openFile(file) {
        if (this.workbook) {
            if (!this.closeFile()) {
                throw new Error('Fatal error! Cannot close opened file.');
            }
        }
        this.workbook = xlsx.readFile(file);
        this.file = file;
        return !!this.workbook;
    }

    saveFile(file) {
        xlsx.writeFile(this.workbook, file, {cellDates: true});
        this.file = file;
        return fs.existsSync(this.file);
    }

    closeFile() {
        if (this.workbook) {
            this.workbook = null;
            this.file = null;
        }
        return this.workbook === null;
    }

    editDates() {
        let sheetNames = this.workbook.SheetNames,
            errors = 0;
        for (let i = 0; i < sheetNames.length; i++) {
            let worksheet = this.workbook.Sheets[sheetNames[i]],
                rows = xlsx.utils.decode_range(worksheet['!ref']).e.r + 1,
                column = 'A';
            for (let j = 1; j <= rows; j++) {
                let date = worksheet[column + j.toString()];
                let error = false;
                date.t = 's';
                date.v = date.w;
                date.h = date.w;
                if (error) {
                    errors++;
                } else {
                    this.workbook.Sheets[sheetNames[i]][column + j.toString()] = date;
                }
            }
            column = 'C';
            for (let j = 1; j <= rows; j++) {
                let date = worksheet[column + j.toString()];
                let error = false;
                date.t = 's';
                date.v = date.w;
                date.h = date.w;
                if (error) {
                    errors++;
                } else {
                    this.workbook.Sheets[sheetNames[i]][column + j.toString()] = date;
                }
            }
        }
        return errors === 0
    }

    editPhones() {
        var sheetNames = this.workbook.SheetNames;
        var errors = 0;
        for (let i = 0; i < sheetNames.length; i++) {
            let worksheet = this.workbook.Sheets[sheetNames[i]],
                rows = xlsx.utils.decode_range(worksheet['!ref']).e.r + 1,
                column = 'D';
            for (let j = 1; j <= rows; j++) {
                let phone = worksheet[column + j.toString()];
                let error = false;
                phone.t = phone.t != 's' ? 's' : phone.t;
                phone.r = null;
                phone.w = phone.w.replace(/[-+()\s]/g, '');
                if (!isNaN(parseInt(phone.w))) {
                    if (phone.w.length == 10 && phone.w[0] == '7') {
                        phone.w = '8' + phone.w;
                    }

                } else {
                    error = true;
                }
                phone.v = phone.w;
                if (error) {
                    errors++;
                } else {
                    this.workbook.Sheets[sheetNames[i]][column + j.toString()] = phone;
                }
            }
        }
        return errors === 0
    }

    editNames() {
        var sheetNames = this.workbook.SheetNames;
        var errors = 0;
        for (let i = 0; i < sheetNames.length; i++) {
            let worksheet = this.workbook.Sheets[sheetNames[i]],
                rows = xlsx.utils.decode_range(worksheet['!ref']).e.r + 1,
                column = 'B';
            for (let j = 1; j <= rows; j++) {
                let name = worksheet[column + j.toString()];
                let error = false;
                name.t = name.t != 's' ? 's' : name.t;
                name.r = null;
                name.w = name.w.trim();
                name.w = name.w.replace(/[.]/g, ' ');
                let nameParts;
                nameParts = name.w.split(' ');
                name.w = '';
                if (nameParts.length > 0) {
                    name.w = nameParts[0];
                    if (nameParts.length > 1 && nameParts[1]) {
                        name.w = name.w + ' ' + nameParts[1][0].toUpperCase() + '.';
                        if (nameParts.length > 2 && nameParts[2]) {
                            name.w = name.w + ' ' + nameParts[2][0].toUpperCase() + '.';
                        }
                    }
                } else {
                    error = true;
                }
                name.v = name.w;
                if (error) {
                    errors++;
                } else {
                    this.workbook.Sheets[sheetNames[i]][column + j.toString()] = name;
                }
            }
        }
        return errors === 0
    }
}

/* EXPORTS */

module.exports = {
    Parser: Parser
};