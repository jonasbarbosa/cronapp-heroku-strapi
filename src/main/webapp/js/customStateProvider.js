/*
To add your route in the angular, uncomment the code and use this structure
*/
// window.customStateProvider = function($stateProvider) {
//   $stateProvider
//     .state('login', {
//       url: "",
//       controller: 'LoginController',
//       templateUrl: 'views/login.view.html'
//     })

//     .state('social', {
//       url: "/connected",
//       controller: 'SocialController',
//       templateUrl: 'views/login.view.html'
//     })

//     .state('socialError', {
//       url: "/notconnected",
//       controller: 'SocialController',
//       templateUrl: 'views/login.view.html'
//     })

//     .state('main', {
//       url: "/",
//       controller: 'LoginController',
//       templateUrl: 'views/login.view.html'
//     })

//     .state('publicRoot', {
//       url: "/public/{name:.*}",
//       controller: 'PageController',
//       templateUrl: function(urlattr) {
//         return 'views/public/' + urlattr.name + '.view.html';
//       }
//     })

//     .state('public', {
//       url: "/home/public",
//       controller: 'PublicController',
//       templateUrl: function(urlattr) {
//         return 'views/public/home.view.html';
//       }
//     })

//     .state('public.pages', {
//       url: "/{name:.*}",
//       controller: 'PageController',
//       templateUrl: function(urlattr) {
//         return 'views/public/' + urlattr.name + '.view.html';
//       }
//     })

//     .state('home', {
//       url: "/home",
//       controller: 'HomeController',
//       templateUrl: 'views/logged/home.view.html'
//     })

//     .state('home.pages', {
//       url: "/{name:.*}",
//       controller: 'PageController',
//       templateUrl: function(urlattr) {
//         return 'views/' + urlattr.name + '.view.html';
//       }
//     })

//     .state('404', {
//       url: "/error/404",
//       controller: 'PageController',
//       templateUrl: function(urlattr) {
//         return 'views/error/404.view.html';
//       }
//     })
//     .state('403', {
//       url: "/error/403",
//       controller: 'PageController',
//       templateUrl: function(urlattr) {
//         return 'views/error/403.view.html';
//       }
//     });
// }