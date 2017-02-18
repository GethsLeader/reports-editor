(function (angular) {
    var component = angular.module('uploader', []);

    component.controller('uploaderController', function ($scope, $element) {
        $scope.uploader = {
            fileInput: $element.find('input'),
            fileReader: new FileReader(),
            file: null,
            extension: null,
            allowedExtensions: ['.xlsx', '.ods', '.xls'],
            converting: false,
            convert: function () {
                $scope.uploader.converting = true;
                $element[0].submit();
            },
            clear: function () {
                $scope.uploader.file = null;
            }
        };

        angular.element($scope.uploader.fileInput).on('change', function (event) {
            $scope.$apply(function () {
                $scope.uploader.file = event.target.files[0];
                $scope.uploader.extension = null;
                if ($scope.uploader.file) {
                    var temp = $scope.uploader.file.name.split('.');
                    if (temp.length > 1 && temp[temp.length - 1] && $scope.uploader.allowedExtensions.indexOf('.' + temp[temp.length - 1]) >= 0) {
                        $scope.uploader.extension = temp[temp.length - 1];
                    }
                }
                $scope.uploader.fileReader.readAsDataURL(event.target.files[0]);
            });
        });
    });

    component.directive('uploader', function (environment) {
            return {
                replace: true,
                restrict: 'E',
                scope: {},
                templateUrl: environment.getViewsPath(component.name) + 'form.html',
                controller: 'uploaderController',
                compile: function (element, attr) {
                    return {
                        pre: function (scope, element, attrs, ctrls) {
                        },
                        post: function (scope, element, attrs, ctrls) {
                        }
                    }
                }
            }
        }
    );
})(angular);