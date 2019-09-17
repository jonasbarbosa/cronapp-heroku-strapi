(function($app) {
  angular.module('custom.controllers', []);

  app.controller('HomeController', function($controller, $scope, $http, $rootScope, $state, $translate, Notification, ReportService, UploadService, $location, $stateParams) {

    $rootScope.http = $http;
    $rootScope.Notification = Notification;
    $scope.params = $stateParams;
    $rootScope.UploadService = UploadService;

    var queryStringParams = $location.search();
    for (var key in queryStringParams) {
      if (queryStringParams.hasOwnProperty(key)) {
        $scope.params[key] = queryStringParams[key];
      }
    }

    $rootScope.getReport = function(reportName, params) {
      ReportService.openReport(reportName, params);
    }

    app.registerEventsCronapi($scope, $translate);

    for( var x in app.userEvents)
      $scope[x] = app.userEvents[x].bind($scope);

    $scope.message = {};

    try { $controller('AfterHomeController', { $scope: $scope }); } catch(e) {};
    try { if ($scope.blockly.events.afterHomeRender) $scope.blockly.events.afterHomeRender(); } catch(e) {};
  });
}(app));