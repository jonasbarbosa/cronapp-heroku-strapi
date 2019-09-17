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
  'upload.services',
  'ui.tinymce'
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
        'preferredLocale': 'pt_br',
        'urlPrefix': ''
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

        if (window.customStateProvider) {
          window.customStateProvider($stateProvider);
        }
        else {
          // Set up the states
          $stateProvider
              .state('login', {
                url: "",
                controller: 'LoginController',
                templateUrl: 'views/login.view.html'
              })

              .state('social', {
                url: "/connected",
                controller: 'SocialController',
                templateUrl: 'views/login.view.html'
              })

              .state('socialError', {
                url: "/notconnected",
                controller: 'SocialController',
                templateUrl: 'views/login.view.html'
              })

              .state('main', {
                url: "/",
                controller: 'LoginController',
                templateUrl: 'views/login.view.html'
              })

              .state('publicRoot', {
                url: "/public/{name:.*}",
                controller: 'PageController',
                templateUrl: function(urlattr) {
                  return 'views/public/' + urlattr.name + '.view.html';
                }
              })

              .state('public', {
                url: "/home/public",
                controller: 'PublicController',
                templateUrl: function(urlattr) {
                  return 'views/public/home.view.html';
                }
              })

              .state('public.pages', {
                url: "/{name:.*}",
                controller: 'PageController',
                templateUrl: function(urlattr) {
                  return 'views/public/' + urlattr.name + '.view.html';
                }
              })

              .state('home', {
                url: "/home",
                controller: 'HomeController',
                templateUrl: 'views/logged/home.view.html',
                resolve: {
                  data: function ($translate) {
                    $translate.refresh();
                  }
                }
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
        }

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/error/404");
      })
      .factory('originPath', ['$location', function($location) {
        var originPath = {
          request: function(config) {
            config.headers['origin-path'] = $location.path();
            return config;
          }
        };
        return originPath;
      }])
      .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('originPath');
      }])
      .config(function($translateProvider, tmhDynamicLocaleProvider) {

        $translateProvider.useMissingTranslationHandlerLog();

        $translateProvider.useLoader('customTranslateLoader', {
            files: [{
              prefix: 'i18n/locale_',
              suffix: '.json'
            },
            {
              prefix: 'plugins/cronapp-framework-js/i18n/locale_',
              suffix: '.json'
            }]
        });

        $translateProvider.registerAvailableLanguageKeys(
            window.translations.localesKeys,
            window.translations.localesRef
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
                  if (value && JSON.stringify(''+value) === dataEvaluated) {
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
      .controller('PageController', function($controller, $scope, $stateParams, $location, $http, $rootScope, $translate, Notification, UploadService, $timeout) {
        // save state params into scope
        $scope.params = $stateParams;
        $scope.$http = $http;
        $scope.Notification = Notification;
        $scope.UploadService = UploadService;

        app.registerEventsCronapi($scope, $translate);
        
        // Query string params
        var queryStringParams = $location.search();
        for (var key in queryStringParams) {
          if (queryStringParams.hasOwnProperty(key)) {
            $scope.params[key] = queryStringParams[key];
          }
        }

        //Components personalization jquery
        $scope.registerComponentScripts = function() {
          //carousel slider
          $('.carousel-indicators li').on('click', function() {
            var currentCarousel = '#' + $(this).parent().parent().parent().attr('id');
            var index = $(currentCarousel + ' .carousel-indicators li').index(this);
            $(currentCarousel + ' #carousel-example-generic').carousel(index);
          });
        };

        $scope.registerComponentScripts();

        try {
          var contextAfterPageController = $controller('AfterPageController', { $scope: $scope });
          app.copyContext(contextAfterPageController, this, 'AfterPageController');
        } catch(e) {}

        $timeout(function () {
          // Verify if the 'afterPageRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
          if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterPageRender && $scope.blockly.events.afterPageRender instanceof Function) {
            $scope.blockly.events.afterPageRender();
          }
        });

      })

      .run(function($rootScope, $state) {
        $rootScope.$on('$stateChangeError', function() {
          if (arguments.length >= 6) {
            var requestObj = arguments[5];
            if (requestObj.status === 404 || requestObj.status === 403) {
              localStorage.removeItem('_u');
              $state.go('login');
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
  $scope.$evt = $evt;

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

app.copyContext = function(fromContext, toContext, controllerName) {
  if (fromContext) {
    for (var item in fromContext) {
      if (!toContext[item])
        toContext[item] = fromContext[item];
      else
        toContext[item+controllerName] = fromContext[item];
    }
  }
};

app.factory('customTranslateLoader', function ($http, $q) {

  return function (options) {

    if (!options || (!angular.isArray(options.files) && (!angular.isString(options.prefix) || !angular.isString(options.suffix)))) {
      throw new Error('Couldn\'t load static files, no files and prefix or suffix specified!');
    }

    if (!options.files) {
      options.files = [{
        prefix: options.prefix,
        suffix: options.suffix
      }];
    }

    var load = function (file) {
      if (!file || (!angular.isString(file.prefix) || !angular.isString(file.suffix))) {
        throw new Error('Couldn\'t load static file, no prefix or suffix specified!');
      }

      var deferred = $q.defer();

      $http(angular.extend({
        url: [
          file.prefix,
          options.key,
          file.suffix
        ].join(''),
        method: 'GET',
        params: ''
      }, options.$http)).success(function (data) {
        deferred.resolve(data);
      }).error(function () {
        deferred.resolve({});
      });

      return deferred.promise;
    };

    var deferred = $q.defer(),
        promises = [],
        length = options.files.length;

    for (var i = 0; i < length; i++) {
      promises.push(load({
        prefix: options.files[i].prefix,
        key: options.key,
        suffix: options.files[i].suffix
      }));
    }

    $q.all(promises).then(function (data) {
      var length = data.length,
          mergedData = {};

      for (var i = 0; i < length; i++) {
        for (var key in data[i]) {
          mergedData[key] = data[i][key];
        }
      }

      deferred.resolve(mergedData);

    }, function (data) {
      deferred.reject(data);
    });

    return deferred.promise;
  };

});

window.safeApply = function(fn) {
  var phase = this.$root.$$phase;
  if (phase === '$apply' || phase === '$digest') {
    if (fn && (typeof(fn) === 'function')) {
      fn();
    }
  } else {
    this.$apply(fn);
  }
};
