Reports Editor
==============

DESCRIPTION
-----------
Its simple web-application for parsing data from uploading __.xslx__ files.

INSTALLATION
------------
####1) clone repository:
```
git clone git@github.com:GethsLeader/reports-editor.git
```
####2) install backend dependencies:
```
npm install
```
##### Dependencies reference:
* **express** - express web-application framework
* **debug** - debugging utility
* **body-parser** - middleware for body parsing
* **cookie-parser** - middleware for cookies parsing
* **multer** - middleware for "multipart/form-data" parsing
* **morgan** - advanced middleware for internal logging
* **winston** - advanced logging tool
* **ejs-mate** - view template engine
* **serve-favicon** - application icon provider
* **xlsx** - office files working library
* **jsonfile** - json files working library

####3) install frontend dependencies:
```
bower install
```
##### Dependencies reference:
* **angular** - angular framework
* **angular-animate** - animation support module
* **angular-touch** - touch support module
* **angular-strap** - angular directives for bootstrap
* **bootstrap** - its just a bootstrap

####4) testing:
* install **Mocha** [\[link\]](https://mochajs.org/) testing framework globally
```
npm install mocha -g
```
* install **chai** [\[link\]](http://chaijs.com/) assertion library globally
```
npm install chai -g
```
* link **chai** with project (if necessary)
```
npm link chai
```
* start test
```
npm test
```

####5) launch:
* be sure about environment variables for development (all other values lead to production)
```
NODE_ENV=development
```
* launch
```
npm start
```