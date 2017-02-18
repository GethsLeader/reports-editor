'use strict';

const chai = require('chai');

chai.should();
const assert = chai.assert;

describe('xls', () => {

    const Parser = require('../modules/reports-parser').Parser;
    let parser, file = '/home/tb/tests/incoming_test_careful_usage.ods', outdir = '/home/tb/tests/'; // file = 'test/test.ods', outdir = 'test/';

    describe('open', () => {

        it('trying to create new Parser instance', () => {
            parser = new Parser();
            parser.should.be.a.instanceof(Parser);
        });

        it('trying prepare test.ods file in test folder', (done) => {
            let options = {
                prepareCmd: 'libreoffice --headless --convert-to xlsx --infilter=CSV:44,34,76,1 ' + file + ' --outdir ' + outdir,
                prepareExt: '.xlsx',
                fileInCmd: false,
                prepareTimeout: 5000
            };
            parser.prepareFile(file, options)
                .then((result) => {
                    file = result;
                    done();
                })
                .catch((error) => {
                    done(error);
                })
        });

        it('trying open test.xlsx file in test folder', () => {
            parser.openFile(file);
            parser.file.should.be.equal(file);
        });

        it('data should be loaded', () => {
            parser.workbook.should.exist;
            parser.workbook.SheetNames.length.should.be.above(0);
        });
    });

    describe('edit', () => {
        it('edit phones in sheets', () => {
            parser.editPhones().should.be.true;
        });

        it('edit names in sheets', () => {
            parser.editNames().should.be.true;
        });

        it('edit dates in sheets', () => {
            parser.editDates().should.be.true;
        });
    });

    describe('save', () => {
        it('save edited file to result.xlsx', () => {
            let file = 'test/result.xlsx';
            parser.saveFile(file).should.be.true;
        });
    });

    describe('close', () => {
        it('trying close test.xls file', () => {
            parser.closeFile().should.be.true;
        });
    });
});