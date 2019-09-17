(function($app) {
  angular.module('upload.services', []).service('UploadService', function($http, $compile, $modal, Upload) {

    var body = $('body');
    var $scope = angular.element(body.get(0)).scope();

    this.upload = function(data) {
      $modal.open({
        templateUrl : 'plugins/cronapp-framework-js/components/upload/upload.html',
        controller : 'UploadController',
        resolve : {
          data : function() {
            return data;
          }
        }
      });
    }.bind(this);


  });

  function strFormat(str) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    return str.replace(/%s/g, function() {
      return args[i++];
    });
  }

  angular.module('custom.controllers').controller('UploadController',
      function($scope, $http, $translate, $stateParams, $location, $http, $modalInstance, data) {

        app.registerEventsCronapi($scope, $translate);

        // save state params into scope
        $scope.params = $stateParams;
        $scope.$http = $http;

        // Query string params
        var queryStringParams = $location.search();
        for (var key in queryStringParams) {
          if (queryStringParams.hasOwnProperty(key)) {
            $scope.params[key] = queryStringParams[key];
          }
        }

        $scope.files = [];
        $scope.uploading = false;
        $scope.uploaded = true;
        $scope.progress = 0;
        $scope.data = data;
        $scope.message = $translate.instant('Upload.oneFile');

        if (data.multiple == "true") {
          $scope.message = $translate.instant('Upload.multipleFile');
        }

        if (data.description) {
          $scope.message = data.description;
        }

        $scope.safeApply = safeApply;

        $scope.uploadFile = function(files) {
          var pageScope = $scope.data.scope;
          var uploadUrl = 'api/cronapi/upload/'+data.id;
          var formData = new FormData();
          if (files.length == 0) {
            this.Notification.error(strFormat($translate.instant('Upload.errorValidation'), data.maxSize, data.filter));
          } else {
            for (var i=0;i<files.length;i++) {
              formData.append("file", files[i]);
              console.log(files[i].$valid);
            }
            var _u = JSON.parse(localStorage.getItem('_u'));
            this.$promise = $http({
              method: 'POST',
              url: (window.hostApp || "") + uploadUrl,
              data: formData,
              headers:  {
                'Content-Type': undefined,
                'X-AUTH-TOKEN': (_u ?_u.token : '')
              },
              onProgress: function(event) {
                this.safeApply(function() {
                  if (event.lengthComputable) {
                    var complete = (event.loaded / event.total * 100 | 0);
                    $scope.progress = complete;
                  }
                  $scope.uploading = true;
                  console.log(complete);
                });
              }.bind(this)
            }).success(function(data, status, headers, config) {
              var result = pageScope.cronapi.evalInContext(JSON.stringify(data));
              $scope.uploaded = true;
              $scope.uploading = false;
              $scope.close();
            }.bind(this)).error(function(data, status, errorThrown) {
              this.Notification.error(data.error);
              $scope.uploading = false;
              $scope.close();
            }.bind(this));
          }
        }.bind($scope);

        $scope.close = function() {
          $modalInstance.dismiss('cancel');
        };

      });
}(app));