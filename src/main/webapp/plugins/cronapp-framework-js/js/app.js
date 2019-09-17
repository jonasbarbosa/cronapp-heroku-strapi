var cronappModules = [
  'ui.router',
  'ui.select',
  'ui-select-infinity',
  'ngResource',
  'ngSanitize',
  'custom.controllers',
  'custom.services',
  'datasourcejs',
  'chart.js',
  'ngJustGage',
  'pascalprecht.translate',
  'tmh.dynamicLocale',
  'ui-notification',
  'ui.bootstrap',
  'ngFileUpload',
  'report.services',
  'upload.services'
];

if (window.customModules) {
  cronappModules = cronappModules.concat(window.customModules);
}

var app = (function() {
  return angular.module('MyApp', cronappModules)

      .constant('LOCALES', {
        'locales': {
          'pt_br': 'Portugues (Brasil)',
          'en_us': 'English'
        },
        'preferredLocale': 'pt_br'
      })
      .config([
        '$httpProvider',
        function($httpProvider) {
          var interceptor = [
            '$q',
            '$rootScope',
            function($q, $rootScope) {
              var service = {
                'request': function(config) {
                  var _u = JSON.parse(localStorage.getItem('_u'));
                  if (_u && _u.token) {
                    config.headers['X-AUTH-TOKEN'] = _u.token;
                    window.uToken = _u.token;
                  }
                  return config;
                }
              };
              return service;
            }
          ];
          $httpProvider.interceptors.push(interceptor);
        }
      ])
      .config(function($stateProvider, $urlRouterProvider, NotificationProvider) {
        NotificationProvider.setOptions({
          delay: 5000,
          startTop: 20,
          startRight: 10,
          verticalSpacing: 20,
          horizontalSpacing: 20,
          positionX: 'right',
          positionY: 'top'
        });

        // Set up the states
        $stateProvider

            .state('index', {
              url: "",
              controller: 'HomeController',
              templateUrl: 'views/home.view.html'
            })

            .state('main', {
              url: "/",
              controller: 'HomeController',
              templateUrl: 'views/home.view.html'
            })

            .state('home', {
              url: "/home",
              controller: 'HomeController',
              templateUrl: 'views/home.view.html'
            })

            .state('home.pages', {
              url: "/{name:.*}",
              controller: 'PageController',
              templateUrl: function(urlattr) {
                return 'views/' + urlattr.name + '.view.html';
              }
            })

            .state('404', {
              url: "/error/404",
              controller: 'PageController',
              templateUrl: function(urlattr) {
                return 'views/error/404.view.html';
              }
            })

            .state('403', {
              url: "/error/403",
              controller: 'PageController',
              templateUrl: function(urlattr) {
                return 'views/error/403.view.html';
              }
            });

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/error/404");
      })

      .config(function($translateProvider, tmhDynamicLocaleProvider) {

        $translateProvider.useMissingTranslationHandlerLog();

        $translateProvider.useStaticFilesLoader({
          files: [
            {
              prefix: 'i18n/locale_',
              suffix: '.json'
            },
            {
              prefix: 'plugins/cronapp-framework-js/i18n/locale_',
              suffix: '.json'
            }]
        });

        $translateProvider.registerAvailableLanguageKeys(
            ['pt_br', 'en_us'], {
              'en*': 'en_us',
              'pt*': 'pt_br',
              '*': 'pt_br'
            }
        );

        var locale = (window.navigator.userLanguage || window.navigator.language || 'pt_br').replace('-', '_');

        $translateProvider.use(locale.toLowerCase());
        $translateProvider.useSanitizeValueStrategy('escaped');

        tmhDynamicLocaleProvider.localeLocationPattern('plugins/angular-i18n/angular-locale_{{locale}}.js');

        if (moment)
          moment.locale(locale);
      })

      .directive('crnValue', ['$parse', function($parse) {
        return {
          restrict: 'A',
          require: '^ngModel',
          link: function(scope, element, attr, ngModelCtrl) {
            var evaluatedValue;
            if (attr.value) {
              evaluatedValue = attr.value;
            } else {
              evaluatedValue = $parse(attr.crnValue)(scope);
            }

            element.attr("data-evaluated", JSON.stringify(evaluatedValue));
            element.bind("click", function(event) {
              scope.$apply(function() {
                ngModelCtrl.$setViewValue(evaluatedValue);
                $(element).data('changed', true);
              }.bind(element));
            });

            scope.$watch(function(){return ngModelCtrl.$modelValue}, function(value, old){
              if (value !== old) {
                var dataEvaluated = element.attr("data-evaluated");
                var changed = $(element).data('changed');
                $(element).data('changed', false);
                if (!changed) {
                  if (value && JSON.stringify(''+value) == dataEvaluated) {
                    $(element)[0].checked = true
                  } else {
                    $(element)[0].checked = false;
                  }
                }
              }
            });           
          }
        };
      }])
	  
      .decorator("$xhrFactory", [
        "$delegate", "$injector",
        function($delegate, $injector) {
          return function(method, url) {
            var xhr = $delegate(method, url);
            var $http = $injector.get("$http");
            var callConfig = $http.pendingRequests[$http.pendingRequests.length - 1];
            if (angular.isFunction(callConfig.onProgress))
              xhr.upload.addEventListener("progress",callConfig.onProgress);
            return xhr;
          };
        }
      ])
      // General controller
    .controller('PageController', function($scope, $stateParams, $location, $http, $rootScope) {

      for (var x in app.userEvents)
          $scope[x] = app.userEvents[x].bind($scope);

        try {
          if (cronapi)
            $scope['cronapi'] = cronapi;
        } catch (e) {
          console.info('Not loaded cronapi functions');
          console.info(e);
        }
        try {
          if (blockly)
            $scope['blockly'] = blockly;
        } catch (e) {
          console.info('Not loaded blockly functions');
          console.info(e);
        }

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
        registerComponentScripts();

        try { $controller('AfterPageController', { $scope: $scope }); } catch(e) {};
        try { if ($scope.blockly.events.afterPageRender) $scope.blockly.events.afterPageRender(); } catch(e) {};
      })

      .run(function($rootScope, $state) {
        $rootScope.$on('$stateChangeError', function() {
          if (arguments.length >= 6) {
            var requestObj = arguments[5];
            if (requestObj.status === 404 || requestObj.status === 403) {
              $state.go(requestObj.status.toString());
            }
          } else {
            $state.go('404');
          }
        });
      });

}(window));

app.userEvents = {};

//Configuration
app.config = {};
app.config.datasourceApiVersion = 2;

app.bindScope = function($scope, obj) {
  var newObj = {};

  for (var x in obj) {
    // var name = parentName+'.'+x;
    // console.log(name);
    if (typeof obj[x] == 'string' || typeof obj[x] == 'boolean')
      newObj[x] = obj[x];
    else if (typeof obj[x] == 'function')
      newObj[x] = obj[x].bind($scope);
    else {
      newObj[x] = app.bindScope($scope, obj[x]);
    }
  }

  return newObj;
};

app.registerEventsCronapi = function($scope, $translate) {
  for (var x in app.userEvents)
    $scope[x] = app.userEvents[x].bind($scope);

  $scope.vars = {};

  try {
    if (cronapi) {
      $scope['cronapi'] = app.bindScope($scope, cronapi);
      $scope['cronapi'].$scope = $scope;
      $scope.safeApply = safeApply;
      if ($translate) {
        $scope['cronapi'].$translate = $translate;
      }
    }
  } catch (e) {
    console.info('Not loaded cronapi functions');
    console.info(e);
  }
  try {
    if (blockly) {
      blockly.cronapi = cronapi;
      $scope['blockly'] = app.bindScope($scope, blockly);
    }
  } catch (e) {
    console.info('Not loaded blockly functions');
    console.info(e);
  }
};

window.safeApply = function(fn) {
  var phase = this.$root.$$phase;
  if (phase == '$apply' || phase == '$digest') {
    if (fn && (typeof(fn) === 'function')) {
      fn();
    }
  } else {
    this.$apply(fn);
  }
};

//Components personalization jquery
var registerComponentScripts = function() {
  //carousel slider
  $('.carousel-indicators li').on('click', function() {
    var currentCarousel = '#' + $(this).parent().parent().parent().attr('id');
    var index = $(currentCarousel + ' .carousel-indicators li').index(this);
    $(currentCarousel + ' #carousel-example-generic').carousel(index);
  });
}