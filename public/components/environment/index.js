(function () {
    var component = angular.module('environment', []);

    const componentsPath = '/components/';

    function getViewsPath(componentName) {
        return componentsPath + componentName + '/views/';
    }

    component.constant('environment', {
        componentsPath: componentsPath,
        getViewsPath: getViewsPath
    });

})();
