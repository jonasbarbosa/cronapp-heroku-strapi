angular.module('MyApp')
  .directive("dateFormat", function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, modelCtrl) {
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
