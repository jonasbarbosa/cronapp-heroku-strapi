(function($app) {
  angular.module('custom.controllers', []);

    // refresh token
    var refreshToken = function ($http, success, error) {
        $http({
            method: 'GET',
            url: 'auth/refresh'
        }).success(function (data, status, headers, config) {
            // Store data response on local storage
            localStorage.setItem("_u", JSON.stringify(data));
            // Recussive
            setTimeout(function () {
                refreshToken($http, success, error);
                // refresh time
            }, (1800 * 1000));
            success();
        }).error(function () {
            error();
        });
    };

  app.controller('LoginController', function($controller, $scope, $http, $rootScope, $window, $state, $translate, Notification, ReportService, UploadService, $location, $stateParams, $timeout) {

    $scope.$http = $http;
    $scope.params = $stateParams;
    app.registerEventsCronapi($scope, $translate);

    $rootScope.http = $http;
    $rootScope.Notification = Notification;
    $rootScope.UploadService = UploadService;

    $rootScope.getReport = function(reportName, params, config) {
      ReportService.openReport(reportName, params, config);
    };

    var queryStringParams = $location.search();
    for (var key in queryStringParams) {
      if (queryStringParams.hasOwnProperty(key)) {
        $scope.params[key] = queryStringParams[key];
      }
    }

    $scope.autoLogin = function(){
      if(localStorage.getItem('_u') && JSON.parse(localStorage.getItem('_u')).token ){
        refreshToken($http, function(){
          $state.go('home');
        }, function(){
          localStorage.removeItem('_u');
        })
      }
    };
    $scope.autoLogin();
    $scope.message = {};
    $scope.renderRecaptcha = function(){
      window.grecaptcha.render('loginRecaptcha');
      window.grecaptcha.reset();
    };
    $scope.login = function(username, password, token) {
      $scope.message.error = undefined;
      if($('form').children('*[class=g-recaptcha]').length){
        $scope.captcha_token = window.grecaptcha.getResponse();
        if(!$scope.captcha_token !== ""){
          window.grecaptcha.execute(function(token){}).then(function(token){
            angular.element($('form[ng-submit="login()"]')[0]).scope().login();
          },function(){
            Notification.error('Error on recaptcha');
          });
          return;
        }
      }
      var user = {
        username : username?username:$scope.username.value,
        password : password?password:$scope.password.value,
        recaptchaToken : $scope.captcha_token ? $scope.captcha_token : undefined
      };

      var headerValues = {
        'Content-Type' : 'application/x-www-form-urlencoded'
      };

      if (token) {
        headerValues["X-AUTH-TOKEN"] = token;
      }

      $http({
        method : 'POST',
        url : 'auth',
        data : $.param(user),
        headers : headerValues
      }).success(handleSuccess).error(handleError);
    };

    function handleSuccess(data, status, headers, config) {
      // Store data response on session storage
      // The local storage will be cleaned when the browser window is closed
      if(typeof (Storage) !== "undefined") {
        // save the user data on localStorage
        localStorage.setItem("_u", JSON.stringify(data));
        $rootScope.session = JSON.parse(localStorage._u);
      }
      else {
        // Sorry! No Web Storage support.
        // The home page may not work if it depends
        // on the logged user data
      }

      // Redirect to home page
      $state.go("home");

      // Verify if the 'onLogin' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.onLogin && $scope.blockly.events.onLogin instanceof Function) {
        $scope.blockly.events.onLogin();
      }
    }

    function handleError(data, status, headers, config) {
      var error;
      if (status === 401) {
        error = $translate.instant('Login.view.invalidPassword');
      } else if (status === 403) {
        error = $translate.instant('Admin.view.Access Denied');
      } else {
        error = data;
      }
      Notification.error(error);
    }

    try {
      var contextAfterLoginController = $controller('AfterLoginController', { $scope: $scope });
      app.copyContext(contextAfterLoginController, this, 'AfterLoginController');
    } catch(e) {}

    $timeout(function () {
      // Verify if the 'afterLoginRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterLoginRender && $scope.blockly.events.afterLoginRender instanceof Function) {
        $scope.blockly.events.afterLoginRender();
      }
    });

  });

  app.controller('HomeController', function($controller, $scope, $http, $rootScope, $state, $translate, Notification, ReportService, UploadService, $location, $stateParams, $timeout) {

    $scope.$http = $http;
    $scope.params = $stateParams;
    app.registerEventsCronapi($scope, $translate);

    $rootScope.http = $http;
    $rootScope.Notification = Notification;
    $rootScope.UploadService = UploadService;

    $rootScope.getReport = function(reportName, params, config) {
      ReportService.openReport(reportName, params, config);
    };

    var queryStringParams = $location.search();
    for (var key in queryStringParams) {
      if (queryStringParams.hasOwnProperty(key)) {
        $scope.params[key] = queryStringParams[key];
      }
    }

    $scope.message = {};

    $scope.selecionado = {
      valor : 1
    };



    $rootScope.session = (localStorage.getItem('_u') !== undefined) ? JSON.parse(localStorage.getItem('_u')) : null;

    if($rootScope.session) {
      // When access home page we have to check
      // if the user is authenticated and the userData
      // was saved on the browser's localStorage
      $rootScope.myTheme = '';
      if ($rootScope.session.user)
        $rootScope.myTheme = $rootScope.session.user.theme;
      $scope.$watch('myTheme', function(value) {
        if(value !== undefined && value !== "") {
          $('#themeSytleSheet').attr('href', "plugins/cronapp-framework-js/css/themes/" + value + ".min.css");
        }
      });
      if(localStorage.getItem('_u') && JSON.parse(localStorage.getItem('_u')).token){
        refreshToken($http,function(){},function(){
          localStorage.removeItem('_u');
          $state.go('login');
        })
      }
    }
    else {
      if (!$scope.ignoreAuth) {
        localStorage.removeItem("_u");
        window.location.href = "";
      }
    }

    $rootScope.logout = function logout() {
      $http({
        method : 'GET',
        url : 'logout',
        headers : {
          'Content-Type' : 'application/json'
        }
      }).success(clean).error(clean);

      function clean() {
        $rootScope.session = {};
        if(typeof (Storage) !== "undefined") {
          localStorage.removeItem("_u");
        }
        window.location.href = "";
      }
    };

    $scope.changePassword = function() {
      if(verifyCredentials()) {
        var user = {
          oldPassword : oldPassword.value,
          newPassword : newPassword.value,
          newPasswordConfirmation : newPasswordConfirmation.value
        };

        $http({
          method : 'POST',
          url : 'changePassword',
          data : $.param(user),
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
          }
        }).success(changeSuccess).error(changeError);
      }

      function changeSuccess(data, status, headers, config) {
        Notification.info($translate.instant('Home.view.passwordChanged'));
        cleanPasswordFields();
      }

      function changeError(data, status, headers, config) {
        var error;

        if (status === 422) {
          error = data;
        } else if (status >= 401) {
          error = $translate.instant('Home.view.InvalidPassword');
        } else {
          error = data;
        }

        Notification.error(error);
      }

      function cleanPasswordFields() {
        oldPassword.value = "";
        newPassword.value = "";
        newPasswordConfirmation.value = "";
        $("#modalPassword").modal("hide");
      }

      function verifyCredentials() {
        if(oldPassword.value === "" || newPassword.value === "" || newPasswordConfirmation.value === "") {
          if(newPasswordConfirmation.value === "") {
            Notification.error($translate.instant('Home.view.ConfirmationPasswordCanNotBeEmpty'));
          }
          if(newPassword.value === "") {
            Notification.error($translate.instant('Home.view.NewPasswordCanNotBeEmpty'));
          }
          if(oldPassword.value === "") {
            Notification.error($translate.instant('Home.view.PreviousPasswordCanNotBeEmpty'));
          }
          return false;
        }
        return true;
      }
    };

    var closeMenuHandler = function() {
      var element = $(this);
      if(element.closest('.sub-menu').length > 0) {
        element.closest(".navbar-nav").collapse('hide');
      }
    };

    $scope.$on('$viewContentLoaded', function() {
      var navMain = $(".navbar-nav");

      // Here your view content is fully loaded !!
      navMain.off("click", "a", closeMenuHandler);
      navMain.on("click", "a", closeMenuHandler);
    });

    $scope.themes = [ "material","cerulean", "cosmo", "cyborg", "darkly", "flatly", "journal", "lumen", "paper", "readable", "sandstone", "simplex", "slate", "spacelab", "superhero", "united", "yeti"];

    $scope.changeTheme = function(theme) {
      if(theme !== undefined) {
        $('body').append('<div id="transition" />');
        $('#transition').css({
          'background-color' : '#FFF',
          'zIndex' : 100000,
          'position' : 'fixed',
          'top' : '0px',
          'right' : '0px',
          'bottom' : '0px',
          'left' : '0px',
          'overflow' : 'hidden',
          'display' : 'block'
        });
        $('#transition').fadeIn(800, function() {
          $('#themeSytleSheet').attr('href', "plugins/cronapp-framework-js/css/themes/" + theme + ".min.css");
          $rootScope.myTheme = theme;
          $('#transition').fadeOut(1000, function() {
            $('#transition').remove();
          });
        });

        var user = {
          theme : theme
        };

        $http({
          method : 'POST',
          url : 'changeTheme',
          data : $.param(user),
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
          }
        }).success(changeSuccess).error(changeError);

        function changeSuccess(data, status, headers, config) {
          $rootScope.session.theme = theme;
          $rootScope.session.user.theme = theme;
          localStorage.setItem("_u", JSON.stringify($rootScope.session));
        }

        function changeError(data, status, headers, config) {
          var error = data;
          Notification.error(error);
        }
      }
    };
    try {
      var contextAfterHomeController = $controller('AfterHomeController', { $scope: $scope });
      app.copyContext(contextAfterHomeController, this, 'AfterHomeController');
    } catch(e) {}

    $timeout(function () {
      // Verify if the 'afterHomeRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterHomeRender && $scope.blockly.events.afterHomeRender instanceof Function) {
        $scope.blockly.events.afterHomeRender();
      }
    });

  });

  app.controller('PublicController', function($controller, $scope) {
    $scope.ignoreAuth = true;
    angular.extend(this, $controller('HomeController', {
      $scope: $scope
    }));
  });

  app.controller('SocialController', function($controller, $scope, $location) {
    $scope.checkSocial = true;
    angular.extend(this, $controller('LoginController', {
      $scope: $scope
    }));

    var queryStringParams = $location.search();
    var params = {};
    for (var key in queryStringParams) {
      if (queryStringParams.hasOwnProperty(key)) {
        params[key] = queryStringParams[key];
      }
    }

    $scope.login("#OAUTH#", "#OAUTH#", params["_ctk"]);
  });

}(app));

window.safeApply = function(fn) {
  var phase = this.$root.$$phase;
  if(phase === '$apply' || phase === '$digest') {
    if(fn && (typeof (fn) === 'function')) {
      fn();
    }
  }
  else {
    this.$apply(fn);
  }
};

