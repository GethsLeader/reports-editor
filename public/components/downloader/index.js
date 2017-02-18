(function (location, angular) {
    var component = angular.module('downloader', []);

    component.controller('downloaderController', function ($scope, $element, $location) {
        $scope.downloader = {
            secondsToStart: 10,
            link: $location.protocol() + '://' + $location.host()
            + ($location.port() == 80 || $location.port() == 443 ? '' : ':' + $location.port())
            + $scope.link,
            interval: null,
            startDownload: function () {
                location.href = $scope.downloader.link;
            },
            turnOff: function () {
                if ($scope.downloader.interval) {
                    clearInterval($scope.downloader.interval);
                    $scope.downloader.interval = null;
                }
                $scope.downloader.secondsToStart = 0;
            },
            turnOn: function () {
                if (!$scope.downloader.interval) {
                    $scope.downloader.interval = setInterval(function () {
                        $scope.$apply(function () {
                                $scope.downloader.secondsToStart--;
                                if ($scope.downloader.secondsToStart <= 0) {
                                    $scope.downloader.turnOff();
                                    $scope.downloader.startDownload();
                                }
                            }
                        );
                    }, 1000);
                } else {
                    throw new Error('Timer already created!');
                }
            }
        };
    });

    component.directive('downloader', function (environment) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    link: '@'
                },
                templateUrl: environment.getViewsPath(component.name) + 'form.html',
                controller: 'downloaderController',
                compile: function (element, attr) {
                    return {
                        pre: function (scope, element, attrs, ctrls) {
                        },
                        post: function (scope, element, attrs, ctrls) {
                            scope.downloader.turnOn();
                        }
                    }
                }
            }
        }
    );
})(location, angular);