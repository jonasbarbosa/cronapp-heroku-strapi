(function() {
  'use strict';

  angular.module('custom.controllers').controller('ParameterController',
      ParameterController).filter('trusted', ['$sce', function($sce) {
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  }]).directive('compile', function($compile, $timeout) {
    return {
      restrict : 'A',
      link : function(scope, elem) {
        $timeout(function() {
          $compile(elem.contents())(scope);
        });
      }
    }
  }).directive("formatDate", function() {
    return {
      require : 'ngModel',
      link : function(scope, elem, attr, modelCtrl) {
        modelCtrl.$formatters.push(function(modelValue) {
          if (modelValue) {
            return new Date(modelValue);
          } else {
            return null;
          }
        });
      }
    };
  });

  ParameterController.$inject = ['$modalInstance', '$scope', 'ReportService',
    'report', 'htmlParameters'];

  function ParameterController($modalInstance, $scope, ReportService, report,
      htmlParameters) {

    $scope.getDescription = function(param) {
      var name = param.name;
      if (param.description) {
        name = param.description;
        //translate
        if (name.indexOf('{{') > -1 && name.indexOf('}}') > -1) {
          name = name.replace('{{','').replace('}}','');
          name = window.cronapi.i18n.translate(name,[]);
        }
      }
      return name;
    };

    $scope.cloneElement = function(el) {
      return angular.copy(el);
    };

    $scope.isVisibleParam = function(param) {
      if (param.name == 'DATA_LIMIT')
        return false;
      else if (param.value === "")
        return true;
      else if (param.value != "")
        return false;

      return true;
    };


    var grp = report.reportName.match(/\/(.*?)(.*?)(\.jrxml|\.report)/);
    $scope.report = report;
    $scope.report.name = grp[2];
    $scope.htmlParameters = htmlParameters;

    function openPDFAsFile(result) {
      // Abrir no modal
      ReportService.openURLContent(result.data);
    }

    function openPDF(result) {
      var blob = new Blob([result.data], {
        type : 'application/pdf'
      });

      var ieEDGE = navigator.userAgent.match(/Edge/g);
      var ie = navigator.userAgent.match(/.NET/g);
      var oldIE = navigator.userAgent.match(/MSIE/g);

      if (ie || oldIE || ieEDGE) {
        window.navigator.msSaveBlob(blob, $scope.report.reportName + ".pdf");
      } else {
        ReportService.openURLContent(URL.createObjectURL(blob));
      }
    }

    $scope.onPrint = function() {
      if ($scope.report.reportName.endsWith('.report'))
        ReportService.openStimulsoftReport($scope.report.contentData, $scope.report.parameters, $scope.report.datasourcesInBand);
      else
        ReportService.getPDFAsFile($scope.report).then(openPDFAsFile);
    };

    $scope.onCancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }
})();
