//Version 2.0.6
(function($app) {

  app.common = {
    generateId: function() {
      var numbersOnly = '0123456789';
      var result = Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      if (numbersOnly.indexOf(result.substr(0,1)) > -1)
        return this.generateId();
      return result;
    }
  }

  var isoDate = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
  var ISO_PATTERN = new RegExp("(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))");

  /**
   * Função que retorna o formato que será utilizado no componente
   * capturando o valor do atributo format do elemento, para mais formatos
   * consulte os formatos permitidos em http://momentjs.com/docs/#/parsing/string-format/
   *
   */
  var patternFormat = function(element) {
    if (element) {
      return $(element).attr('format') || 'DD/MM/YYYY';
    }
    return 'DD/MM/YYYY';
  }

  var parsePermission = function(perm) {
    var result = {
      visible: {
        public: true
      },
      enabled: {
        public: true
      },
      notvisible: {
        public: false
      },
      notenabled: {
        public: false
      }
    }

    if (perm) {
      var perms = perm.toLowerCase().trim().split(",");
      for (var i=0;i<perms.length;i++) {
        var p = perms[i].trim();
        if (p) {
          var pair = p.split(":");
          if (pair.length == 2) {
            var key = pair[0].trim();
            var value = pair[1].trim();
            if (value) {
              var values = value.split(";");
              var json = {};
              for (var j=0;j<values.length;j++) {
                var v = values[j].trim();
                if (v) {
                  json[v] = true;
                }
              }
              result[key] = json;
            }
          }
        }
      }
    }
    return result;
  }
  app.directive('input', transformText);

  app.directive('textarea', transformText);

  var generateBlocklyCall = function(blocklyInfo) {
    var call;
    if (blocklyInfo.type == "client")  {
      call = "cronapi.client('" + blocklyInfo.blocklyClass + "." +  blocklyInfo.blocklyMethod + "')";
      var params = "";
      blocklyInfo.blocklyParams.forEach(function(p) {
        if (params.length  > 0) {
          params += ", ";
        }
        params += (p.value ? p.value : "null");
      });
      call += ".run("+params+")";
    }
    else if (blocklyInfo.type == "server") {
      var blocklyName = blocklyInfo.blocklyClass + '.' + blocklyInfo.blocklyMethod;
      call = "cronapi.server('"+blocklyName+"')";

      var params = "";
      blocklyInfo.blocklyParams.forEach(function(p) {
        if (params.length  > 0) {
          params += ", ";
        }
        params += (p.value ? p.value : "null");
      });

      call += ".run("+params+")";

    }
    return call;

  }

  app.directive('asDate', maskDirectiveAsDate)

      .directive('ngDestroy', function() {
        return {
          restrict: 'A',
          link: function(scope, element, attrs, ctrl) {
            element.on('$destroy', function() {
              if (attrs.ngDestroy && attrs.ngDestroy.length > 0)
                if (attrs.ngDestroy.indexOf('app.') > -1 || attrs.ngDestroy.indexOf('blockly.') > -1)
                  scope.$eval(attrs.ngDestroy);
                else
                  eval(attrs.ngDestroy);
            });
          }
        }
      })

      .directive('dynamicImage', function($compile) {
        var template = '';
        return {
          restrict: 'E',
          replace: true,
          scope: {
            ngModel: '@',
            width: '@',
            height: '@',
            style: '@',
            class: '@'
          },
          require: 'ngModel',
          template: '<div></div>',
          init: function(s) {
            if (!s.ngModel)
              s.ngModel = '';
            if (!s.width)
              s.width = '128';
            if (!s.height)
              s.height = '128';
            if (!s.style)
              s.style = '';
            if (!s.class)
              s.class = '';
            if (!this.containsLetter(s.width))
              s.width += 'px';
            if (!this.containsLetter(s.height))
              s.height += 'px';
          },
          containsLetter: function(value) {
            var containsLetter;
            for (var i=0; i<value.length; i++) {
              containsLetter = true;
              for (var number = 0; number <10; number++)
                if (parseInt(value[i]) == number)
                  containsLetter = false;
              if (containsLetter)
                break;
            }
            return containsLetter;
          },
          link: function(scope, element, attr) {
            this.init(scope);
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");
            var templateDyn    = '<div class="form-group upload-image-component" ngf-drop="" ngf-drag-over-class="dragover">\
                                  <img class="$class$" style="$style$; height: $height$; width: $width$;" ng-if="$ngModel$" data-ng-src="{{$ngModel$.startsWith(\'http\') || ($ngModel$.startsWith(\'/\') && $ngModel$.length < 1000)? $ngModel$ : \'data:image/png;base64,\' + $ngModel$}}">\
                                  <img class="$class$" style="$style$; height: $height$; width: $width$;" ng-if="!$ngModel$" data-ng-src="/plugins/cronapp-framework-js/img/selectImg.svg" class="btn" ng-if="!$ngModel$" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.setFile(\'$ngModel$\', $file)" accept="image/*;capture=camera">\
                                  <div class="remove btn btn-danger btn-xs" ng-if="$ngModel$" ng-click="$ngModel$=null">\
                                    <span class="glyphicon glyphicon-remove"></span>\
                                  </div>\
                                  <div class="btn btn-info btn-xs start-camera-button" ng-if="!$ngModel$" ng-click="cronapi.internal.startCamera(\'$ngModel$\')">\
                                    <span class="glyphicon glyphicon-facetime-video"></span>\
                                  </div>\
                                  <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important; margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
                                </div>';
            element.append(templateDyn
                .split('$height$').join(s.height)
                .split('$width$').join(s.width)
                .split('$ngModel$').join(s.ngModel)
                .split('$style$').join(s.style)
                .split('$class$').join(s.class)
                .split('$required$').join(required)
            );


            $compile(element)(element.scope());
          }
        }
      })
      .directive('dynamicImage', function($compile) {
        var template = '';
        return {
          restrict: 'A',
          scope: true,
          require: 'ngModel',
          link: function(scope, element, attr) {
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");
            var content = element.html();
            var templateDyn    =
                '<div ngf-drop="" ngf-drag-over-class="dragover">\
           <img style="width: 100%;" ng-if="$ngModel$" data-ng-src="{{$ngModel$.startsWith(\'http\') || ($ngModel$.startsWith(\'/\') && $ngModel$.length < 1000)? $ngModel$ : \'data:image/png;base64,\' + $ngModel$}}">\
           <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important; margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
           <div class="btn" ng-if="!$ngModel$" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.setFile(\'$ngModel$\', $file)" ngf-pattern="\'image/*\'" ngf-max-size="$maxFileSize$">\
             $userHtml$\
           </div>\
           <div class="remove-image-button btn btn-danger btn-xs" ng-if="$ngModel$" ng-click="$ngModel$=null">\
             <span class="glyphicon glyphicon-remove"></span>\
           </div>\
           <div class="btn btn-info btn-xs start-camera-button-attribute" ng-if="!$ngModel$" ng-click="cronapi.internal.startCamera(\'$ngModel$\')">\
             <span class="glyphicon glyphicon-facetime-video"></span>\
           </div>\
         </div>';
            var maxFileSize = "";
            if (attr.maxFileSize)
              maxFileSize = attr.maxFileSize;

            templateDyn = $(templateDyn
                .split('$ngModel$').join(attr.ngModel)
                .split('$required$').join(required)
                .split('$userHtml$').join(content)
                .split('$maxFileSize$').join(maxFileSize)
            );

            element.html(templateDyn);
            $compile(templateDyn)(element.scope());
          }
        }
      })
      .directive('dynamicFile', function($compile) {
        var template = '';
        return {
          restrict: 'A',
          scope: true,
          require: 'ngModel',
          link: function(scope, element, attr) {
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");

            var splitedNgModel = attr.ngModel.split('.');
            var datasource = splitedNgModel[0];
            var field = splitedNgModel[splitedNgModel.length-1];
            var number = Math.floor((Math.random() * 1000) + 20);
            var content = element.html();

            var maxFileSize = "";
            if (attr.maxFileSize)
              maxFileSize = attr.maxFileSize;

            var templateDyn    = '\
                                <div ng-show="!$ngModel$" ngf-drop="" ngf-drag-over-class="dragover">\
                                  <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important;margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
                                  <div class="btn" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.uploadFile(\'$ngModel$\', $file, \'uploadprogress$number$\')" ngf-max-size="$maxFileSize$">\
                                    $userHtml$\
                                  </div>\
                                  <div class="progress" data-type="bootstrapProgress" id="uploadprogress$number$" style="display:none">\
                                    <div class="progress-bar" role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" style="width:0%">\
                                      <span class="sr-only"></span>\
                                    </div>\
                                  </div>\
                                </div> \
                                <div ng-show="$ngModel$" class="upload-image-component-attribute"> \
                                  <div class="btn btn-danger btn-xs ng-scope" style="float:right;" ng-if="$ngModel$" ng-click="$ngModel$=null"> \
                                    <span class="glyphicon glyphicon-remove"></span> \
                                  </div> \
                                  <div> \
                                    <div ng-bind-html="cronapi.internal.generatePreviewDescriptionByte($ngModel$)"></div> \
                                    <a href="javascript:void(0)" ng-click="cronapi.internal.downloadFileEntity($datasource$,\'$field$\')">download</a> \
                                  </div> \
                                </div> \
                                ';
            templateDyn = $(templateDyn
                .split('$ngModel$').join(attr.ngModel)
                .split('$datasource$').join(datasource)
                .split('$field$').join(field)
                .split('$number$').join(number)
                .split('$required$').join(required)
                .split('$userHtml$').join(content)
                .split('$maxFileSize$').join(maxFileSize)

            );

            element.html(templateDyn);
            $compile(templateDyn)(element.scope());
          }
        }
      })
      .directive('dynamicFile', function($compile) {
        var template = '';
        return {
          restrict: 'E',
          replace: true,
          scope: {
            ngModel: '@',
          },
          require: 'ngModel',
          template: '<div></div>',
          init: function(s) {
            if (!s.ngModel)
              s.ngModel = '';
          },
          link: function(scope, element, attr) {
            this.init(scope);
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");

            var splitedNgModel = s.ngModel.split('.');
            var datasource = splitedNgModel[0];
            var field = splitedNgModel[splitedNgModel.length-1];
            var number = Math.floor((Math.random() * 1000) + 20);

            var templateDyn    = '\
                                <div ng-show="!$ngModel$">\
                                  <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important;margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
                                  <div class="form-group upload-image-component" ngf-drop="" ngf-drag-over-class="dragover"> \
                                    <img class="ng-scope" style="height: 128px; width: 128px;" ng-if="!$ngModel$" data-ng-src="/plugins/cronapp-framework-js/img/selectFile.png" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.uploadFile(\'$ngModel$\', $file, \'uploadprogress$number$\')" accept="*">\
                                    <progress id="uploadprogress$number$" max="100" value="0" style="position: absolute; width: 128px; margin-top: -134px;">0</progress>\
                                  </div>\
                                </div> \
                                <div ng-show="$ngModel$" class="form-group upload-image-component"> \
                                  <div class="btn btn-danger btn-xs ng-scope" style="float:right;" ng-if="$ngModel$" ng-click="$ngModel$=null"> \
                                    <span class="glyphicon glyphicon-remove"></span> \
                                  </div> \
                                  <div> \
                                    <div ng-bind-html="cronapi.internal.generatePreviewDescriptionByte($ngModel$)"></div> \
                                    <a href="javascript:void(0)" ng-click="cronapi.internal.downloadFileEntity($datasource$,\'$field$\')">download</a> \
                                  </div> \
                                </div> \
                                ';
            element.append(templateDyn
                .split('$ngModel$').join(s.ngModel)
                .split('$datasource$').join(datasource)
                .split('$field$').join(field)
                .split('$number$').join(number)
                .split('$required$').join(required)
            );
            $compile(element)(element.scope());
          }
        }
      })
      .directive('pwCheck', [function() {
        'use strict';
        return {
          require: 'ngModel',
          link: function(scope, elem, attrs, ctrl) {
            var firstPassword = '#' + attrs.pwCheck;
            elem.add(firstPassword).on('keyup', function() {
              scope.$apply(function() {
                var v = elem.val() === $(firstPassword).val();
                ctrl.$setValidity('pwmatch', v);
              });
            });
          }
        }
      }])
      .directive('ngClick', [function() {
        'use strict';
        return {
          link: function(scope, elem, attrs, ctrl) {
            if (scope.rowData) {
              var crnDatasource = elem.closest('[crn-datasource]')
              if (crnDatasource.length > 0) {
                elem.on('click', function() {
                  scope.$apply(function() {
                    var datasource = eval(crnDatasource.attr('crn-datasource'));
                    datasource.active = scope.rowData;
                  });
                });
              }
            }
          }
        }
      }])

      /**
       * Validação de campos CPF e CNPJ,
       * para utilizar essa diretiva, adicione o atributo valid com o valor
       * do tipo da validação (cpf ou cnpj). Exemplo <input type="text" valid="cpf">
       */
      .directive('valid', function() {
        return {
          require: '^ngModel',
          restrict: 'A',
          link: function(scope, element, attrs, ngModel) {
            var validator = {
              'cpf': CPF,
              'cnpj': CNPJ
            };

            ngModel.$validators[attrs.valid] = function(modelValue, viewValue) {
              var value = modelValue || viewValue;
              var fieldValid = validator[attrs.valid].isValid(value);
              if (!fieldValid) {
                element.scope().$applyAsync(function(){ element[0].setCustomValidity(element[0].dataset['errorMessage']); }) ;
              } else {
                element[0].setCustomValidity("");
              }
              return (fieldValid || !value);
            };
          }
        }
      })

      .directive('cronappSecurity', function() {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            var roles = [];
            var user = JSON.parse(localStorage.getItem('_u'))
            if (user && user.roles) {
              roles = user.roles.toLowerCase().split(",");
            }

            var perms = parsePermission(attrs.cronappSecurity);
            var show = false;
            var enabled = false;
            for (var i=0;i<roles.length;i++) {
              var role = roles[i].trim();
              if (role) {
                if (perms.visible[role]) {
                  show = true;
                }
                if (perms.enabled[role]) {
                  enabled = true;
                }
              }
            }

            for (var i=0;i<roles.length;i++) {
              var role = roles[i].trim();
              if (role) {
                if (perms.notvisible[role]) {
                  show = false;
                }
                if (perms.notenabled[role]) {
                  enabled = false;
                }
              }
            }

            if (!show) {
              $(element).hide();
            }

            if (!enabled) {
              $(element).find('*').addBack().attr('disabled', true);
            }
          }
        }
      })

      .directive('qr', ['$window', function($window){
        return {
          restrict: 'A',
          require: '^ngModel',
          template: '<canvas ng-hide="image"></canvas><img ng-if="image" ng-src="{{canvasImage}}"/>',
          link: function postlink(scope, element, attrs, ngModel){
            if (scope.size === undefined  && attrs.size) {
              scope.text = attrs.size;
            }
            var getTypeNumeber = function(){
              return scope.typeNumber || 0;
            };
            var getCorrection = function(){
              var levels = {
                'L': 1,
                'M': 0,
                'Q': 3,
                'H': 2
              };
              var correctionLevel = scope.correctionLevel || 0;
              return levels[correctionLevel] || 0;
            };
            var getText = function(){
              return ngModel.$modelValue || "";
            };
            var getSize = function(){
              return scope.size || $(element).outerWidth();
            };
            var isNUMBER = function(text){
              var ALLOWEDCHARS = /^[0-9]*$/;
              return ALLOWEDCHARS.test(text);
            };
            var isALPHA_NUM = function(text){
              var ALLOWEDCHARS = /^[0-9A-Z $%*+\-./:]*$/;
              return ALLOWEDCHARS.test(text);
            };
            var is8bit = function(text){
              for (var i = 0; i < text.length; i++) {
                var code = text.charCodeAt(i);
                if (code > 255) {
                  return false;
                }
              }
              return true;
            };
            var checkInputMode = function(inputMode, text){
              if (inputMode === 'NUMBER' && !isNUMBER(text)) {
                throw new Error('The `NUMBER` input mode is invalid for text.');
              }
              else if (inputMode === 'ALPHA_NUM' && !isALPHA_NUM(text)) {
                throw new Error('The `ALPHA_NUM` input mode is invalid for text.');
              }
              else if (inputMode === '8bit' && !is8bit(text)) {
                throw new Error('The `8bit` input mode is invalid for text.');
              }
              else if (!is8bit(text)) {
                throw new Error('Input mode is invalid for text.');
              }
              return true;
            };
            var getInputMode = function(text){
              var inputMode = scope.inputMode;
              inputMode = inputMode || (isNUMBER(text) ? 'NUMBER' : undefined);
              inputMode = inputMode || (isALPHA_NUM(text) ? 'ALPHA_NUM' : undefined);
              inputMode = inputMode || (is8bit(text) ? '8bit' : '');
              return checkInputMode(inputMode, text) ? inputMode : '';
            };
            var canvas = element.find('canvas')[0];
            var canvas2D = !!$window.CanvasRenderingContext2D;
            scope.TYPE_NUMBER = getTypeNumeber();
            scope.TEXT = getText();
            scope.CORRECTION = getCorrection();
            scope.SIZE = getSize();
            scope.INPUT_MODE = getInputMode(scope.TEXT);
            scope.canvasImage = '';
            var draw = function(context, qr, modules, tile){
              for (var row = 0; row < modules; row++) {
                for (var col = 0; col < modules; col++) {
                  var w = (Math.ceil((col + 1) * tile) - Math.floor(col * tile)),
                      h = (Math.ceil((row + 1) * tile) - Math.floor(row * tile));
                  context.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
                  context.fillRect(Math.round(col * tile), Math.round(row * tile), w, h);
                }
              }
            };
            var render = function(canvas, value, typeNumber, correction, size, inputMode){
              var trim = /^\s+|\s+$/g;
              var text = value.replace(trim, '');
              var qr = new QRCode(typeNumber, correction, inputMode);
              qr.addData(text);
              qr.make();
              var context = canvas.getContext('2d');
              var modules = qr.getModuleCount();
              var tile = size / modules;
              canvas.width = canvas.height = size;
              if (canvas2D) {
                draw(context, qr, modules, tile);
                scope.canvasImage = canvas.toDataURL() || '';
              }
            };

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              if (value !== old || value !== scope.TEXT) {
                scope.text = ngModel.$modelValue;
                scope.TEXT = getText();
                scope.INPUT_MODE = getInputMode(scope.TEXT);
                render(canvas, scope.TEXT, scope.TYPE_NUMBER, scope.CORRECTION, scope.SIZE, scope.INPUT_MODE);
              }
            });
            render(canvas, scope.TEXT, scope.TYPE_NUMBER, scope.CORRECTION, scope.SIZE, scope.INPUT_MODE);
          }};
      }])

      .directive('uiSelect', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            if (attrs.required != undefined || attrs.ngRequired === "true") {
              $(element).append("<input autocomplete=\"off\" tabindex=\"-1\" class=\"uiSelectRequired ui-select-offscreen\" style=\"left: 50%!important; top: 100%!important;\" type=text ng-model=\""+attrs.ngModel+"\" required>");
              var input = $(element).find("input.uiSelectRequired");
              $compile(input)(element.scope());
            }
          }
        };
      })

      .filter('raw',function($translate) {
        return function(o) {
          if (o != null && o !== undefined) {
            if (typeof o == 'number') {
              return o + "";
            }
            if (typeof o == 'boolean') {
              return o + "";
            }
            if (o instanceof Date) {
              return "datetimeoffset'" + o.toISOString() + "'";
            }
            else {
              if (o.length >= 10 && o.match(ISO_PATTERN)) {
                return "datetimeoffset'" + o + "'";
              } else {
                return "'" + o + "'";
              }
            }
          } else {
            return "";
          }
        }
      })

      .filter('js',function($translate) {
        return function(o) {
          if (o != null && o !== undefined) {
            if (typeof o == 'number' || typeof o == 'boolean') {
              return o + "";
            }
            if (o instanceof Date) {
              return cronapi.toDate(o.toISOString());
            }
            else {
              if (o.length >= 10 && o.match(ISO_PATTERN)) {
                return cronapi.toDate(o);
              } else {
                return "'" + o + "'";
              }
            }
          }
          else {
            return "undefined";
          }
        }
      })

      .filter('mask',function($translate) {
        return function(value, maskValue, type) {
          maskValue = parseMaskType(maskValue, $translate);
          if (!maskValue)
            return value;


          var useUTC;

          if (type !== undefined) {
            useUTC = type == 'date' || type == 'datetime' || type == 'time';

            if (!window.fixedTimeZone) {
              useUTC = false;
            }
          } else {
            useUTC = window.fixedTimeZone;
          }

          if (maskValue.indexOf(";local") > 0) {
            useUTC = false;
          }

          maskValue = maskValue.replace(';1', '').replace(';0', '').replace(';local', '').trim();
          if ((typeof value == "string" && value.match(isoDate)) || value instanceof Date) {
            if (useUTC) {
              return moment(value).utcOffset(window.timeZoneOffset).format(maskValue);
            } else {
              return moment(value).format(maskValue);
            }
          } else if (typeof value == 'number') {
            return format(maskValue, value);
          }  else if (value != undefined && value != null && value != "" && maskValue != '') {
            var input = $("<input type=\"text\">");
            input.mask(maskValue);
            return input.masked(value);
          } else {
            return value;
          }
        };
      })

      .directive('screenParams', [function() {
        'use strict';
        return {
          link: function(scope, elem, attrs, ctrl) {
            var screenParams = eval(attrs.screenParams);
            if (screenParams && screenParams.length) {
              screenParams.forEach(function(screenParam) {
                if (scope.params && !scope.params[screenParam.key])
                  scope.params[screenParam.key] = screenParam.value || '';
              });
            }
          }
        }
      }])

      .directive('mask', maskDirectiveMask)

      .directive('cronappFilter', function($compile) {
        return {
          restrict: 'A',
          require: '?ngModel',
          setFilterInButton: function($element, bindedFilter, operator) {
            var fieldset = $element.closest('fieldset');
            if (!fieldset)
              return;
            var button = fieldset.find('button[cronapp-filter]');
            if (!button)
              return;

            var filters = button.data('filters');
            if (!filters)
              filters = [];

            var index = -1;
            var ngModel = $element.attr('ng-model');
            $(filters).each(function(idx) {
              if (this.ngModel == ngModel)
                index = idx;
            });

            if (index > -1)
              filters.splice(index, 1);

            if (bindedFilter.length > 0) {
              var bindedFilterJson = {
                "ngModel" : ngModel,
                "bindedFilter" : bindedFilter
              };
              filters.push(bindedFilterJson);
            }
            button.data('filters', filters);
          },
          makeAutoPostSearch: function($element, bindedFilter, datasource, attrs) {
            var fieldset = $element.closest('fieldset');
            if (fieldset && fieldset.length > 0) {
              var button = fieldset.find('button[cronapp-filter]');
              if (button && button.length > 0) {
                var filters = button.data('filters');
                if (filters && filters.length > 0) {
                  bindedFilter = '';
                  $(filters).each(function() {
                    bindedFilter += this.bindedFilter+";";
                  });
                }
              }
            }
            datasource.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
          },
          inputBehavior: function(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost) {
            var filterTemplate = '';
            var filtersSplited = attrs.cronappFilter.split(';');
            var datasource;
            if (attrs.crnDatasource) {
              datasource = eval(attrs.crnDatasource);
            } else {
              var fieldset = $element.closest('fieldset');
              if (!fieldset)
                return;
              var button = fieldset.find('button[cronapp-filter]');
              if (!button)
                return;

              if (!button.attr('crn-datasource')) {
                return;
              }

              datasource = eval(button.attr('crn-datasource'));
            }

            var isOData = datasource.isOData()

            $(filtersSplited).each(function() {
              if (this.length > 0) {
                if (filterTemplate != "") {
                  if (isOData) {
                    filterTemplate += " or ";
                  } else {
                    filterTemplate += ";";
                  }
                }

                if (isOData) {
                  if (operator == "=" && typeElement == 'text') {
                    filterTemplate += "substringof({value.lower}, tolower("+this+"))";
                  }
                  else if (operator == "=") {
                    filterTemplate += this + " eq {value}";
                  }
                  else if (operator == "!=") {
                    filterTemplate += this + " ne {value}";
                  }
                  else if (operator == ">") {
                    filterTemplate += this + " gt {value}";
                  }
                  else if (operator == ">=") {
                    filterTemplate += this + " ge {value}";
                  }
                  else if (operator == "<") {
                    filterTemplate += this + " lt {value}";
                  }
                  else if (operator == "<=") {
                    filterTemplate += this + " le {value}";
                  }
                } else {
                  if (typeElement == 'text') {
                    filterTemplate += this + '@' + operator + '%{value}%';
                  } else {
                    filterTemplate += this + operator + '{value}';
                  }
                }
              }
            });
            if (filterTemplate.length == 0) {
              if (isOData) {
                filterTemplate = "{value}";
              } else {
                filterTemplate = '%{value}%';
              }
            }

            var selfDirective = this;
            if (ngModelCtrl) {
              scope.$watch(attrs.ngModel, function(newVal, oldVal) {
                if (angular.equals(newVal, oldVal)) { return; }
                var eType = $element.data('type') || $element.attr('type');
                var value = ngModelCtrl.$modelValue;

                if (isOData) {

                  if (value instanceof Date) {
                    if (eType == "datetime-local") {
                      value = "datetimeoffset'" + value.toISOString() + "'";
                    } else {
                      value = "datetime'" + value.toISOString().substring(0, 23) + "'";
                    }
                  }

                  else if (typeof value == "number") {
                    value = value + "M";
                  }

                  else if (typeof value == "boolean") {
                    value = value;
                  } else {
                    value = "'" + value + "'";
                  }

                } else {
                  if (value instanceof Date) {
                    value = value.toISOString();
                    if (eType == "date") {
                      value = value + "@@date";
                    }
                    else if (eType == "time" || eType == "time-local") {
                      value = value + "@@time";
                    }
                    else {
                      value = value + "@@datetime";
                    }
                  }

                  else if (typeof value == "number") {
                    value = value + "@@number";
                  }

                  else if (typeof value == "boolean") {
                    value = value + "@@boolean";
                  }

                }
                var bindedFilter = filterTemplate.split('{value}').join(value);
                if (typeof value == 'string') {
                  if (bindedFilter.startsWith('substringof({')) {
                    var values = value.split("'").join("").toLowerCase().trim().split(' ');
                    var fulltextIndexFilter = '';
                    values.forEach(function(v, ix) {
                      fulltextIndexFilter += bindedFilter.split('{value.lower}').join("'" + v + "'");
                      if (ix < (values.length - 1)) {
                        fulltextIndexFilter += ' or ';
                      }
                    });
                    bindedFilter = fulltextIndexFilter;
                  }
                  else {
                    bindedFilter = bindedFilter.split('{value.lower}').join(value.toLowerCase());
                  }
                } else {
                  bindedFilter = bindedFilter.split('{value.lower}').join(value);
                }
                if (ngModelCtrl.$viewValue.length == 0)
                  bindedFilter = '';

                selfDirective.setFilterInButton($element, bindedFilter, operator);
                if (autopost)
                  selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);

              });
            }
            else {
              if (typeElement == 'text') {
                $element.on("keyup", function() {
                  var datasource = eval(attrs.crnDatasource);
                  var value = undefined;
                  if (ngModelCtrl && ngModelCtrl != undefined)
                    value = ngModelCtrl.$viewValue;
                  else
                    value = this.value;
                  var bindedFilter = filterTemplate.split('{value}').join(value);
                  if (this.value.length == 0)
                    bindedFilter = '';

                  selfDirective.setFilterInButton($element, bindedFilter, operator);
                  if (autopost)
                    selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);
                });
              }
              else {
                $element.on("change", function() {
                  var datasource = eval(attrs.crnDatasource);
                  var value = undefined;
                  var typeElement = $(this).attr('type');
                  if (attrs.asDate != undefined)
                    typeElement = 'date';

                  if (ngModelCtrl && ngModelCtrl != undefined) {
                    value = ngModelCtrl.$viewValue;
                  }
                  else {
                    if (typeElement == 'checkbox')
                      value = $(this).is(':checked');
                    else if (typeElement == 'date') {
                      value = this.value;
                      if (this.value.length > 0) {
                        var momentDate = moment(this.value, patternFormat(this));
                        value = momentDate.toDate().toISOString();
                      }
                    }
                    else
                      value = this.value;
                  }
                  var bindedFilter = filterTemplate.split('{value}').join(value);
                  if (value.toString().length == 0)
                    bindedFilter = '';

                  selfDirective.setFilterInButton($element, bindedFilter, operator);
                  if (autopost)
                    selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);
                });
              }
            }
          },
          forceDisableDatasource: function(datasourceName, scope) {
            var disableDatasource = setInterval(function() {
              try {
                var datasourceInstance = eval(datasourceName);
                if (datasourceInstance) {
                  $(document).ready(function() {
                    var time = 0;
                    var intervalForceDisable = setInterval(function() {
                      if (time < 10) {
                        scope.$apply(function () {
                          datasourceInstance.enabled = false;
                          datasourceInstance.data = [];
                        });
                        time++;
                      }
                      else
                        clearInterval(intervalForceDisable);
                    }, 20);
                  });
                  clearInterval(disableDatasource);
                }
              }
              catch(e) {
                //try again, until render
              }
            },10);
          },
          buttonBehavior: function(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost) {
            var datasourceName = '';
            if (attrs.crnDatasource)
              datasourceName = attrs.crnDatasource;
            else
              datasourceName = $element.parent().attr('crn-datasource');

            var datasource = eval(datasourceName);
            var isOData = datasource.isOData()

            var requiredFilter = attrs.requiredFilter && attrs.requiredFilter.toString() == "true";
            if (requiredFilter) {
              this.forceDisableDatasource(datasourceName, scope);
            }

            $element.on('click', function() {
              var $this = $(this);
              var filters = $this.data('filters');
              if (datasourceName && datasourceName.length > 0 && filters) {
                var bindedFilter = '';
                $(filters).each(function() {
                  if (bindedFilter != '') {
                    bindedFilter += (isOData?" and ":";");
                  }
                  bindedFilter += this.bindedFilter;
                });

                var datasourceToFilter = eval(datasourceName);

                if (requiredFilter) {
                  datasourceToFilter.enabled = bindedFilter.length > 0;
                  if (datasourceToFilter.enabled) {
                    datasourceToFilter.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
                  }
                  else {
                    scope.$apply(function () {
                      datasourceToFilter.data = [];
                    });
                  }
                }
                else
                  datasourceToFilter.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
              }
            });
          },
          link: function(scope, element, attrs, ngModelCtrl) {
            var $element = $(element);
            var typeElement = $element.data('type') || $element.attr('type');
            if (attrs.asDate != undefined)
              typeElement = 'date';

            var operator = '=';
            if (attrs.cronappFilterOperator && attrs.cronappFilterOperator.length > 0)
              operator = attrs.cronappFilterOperator;

            var autopost = true;
            if (attrs.cronappFilterAutopost && attrs.cronappFilterAutopost == "false")
              autopost = false;

            //Correção para aceitar datasources fora de ordem
            setTimeout(function() {
              if ($element[0].tagName == "INPUT")
                this.inputBehavior(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost);
              else
                this.buttonBehavior(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost);
            }.bind(this), 100);
          }
        }
      })
      .directive('cronRichEditor', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          parseToTinyMCEOptions: function(optionsSelected) {
            var toolbarGroup = {};
            toolbarGroup["allowFullScreen"] = "fullscreen |";
            toolbarGroup["allowPage"] = "fullpage newdocument code pagebreak |";
            toolbarGroup["allowPrint"] = "preview print |";
            toolbarGroup["allowTransferArea"] = "cut copy paste |";
            toolbarGroup["allowDoUndo"] = "undo redo |";
            toolbarGroup["allowSymbol"] = "charmap |";
            toolbarGroup["allowEmbeddedImage"] = "bdesk_photo |";
            toolbarGroup["allowFont"] = "formatselect fontselect fontsizeselect strikethrough bold italic underline removeformat |";
            toolbarGroup["allowLinks"] = "link unlink anchor |";
            toolbarGroup["allowParagraph"] = "alignleft aligncenter alignright alignjustify numlist bullist outdent indent blockquote hr |";
            toolbarGroup["allowFormulas"] = "tiny_mce_wiris_formulaEditor tiny_mce_wiris_formulaEditorChemistry tiny_mce_wiris_CAS |";

            var tinyMCEOptions = {
              menubar: false,
              statusbar: false,
              plugins: "bdesk_photo advlist anchor autolink autoresize autosave charmap code colorpicker contextmenu directionality emoticons fullpage fullscreen hr image imagetools importcss insertdatetime legacyoutput link lists media nonbreaking noneditable pagebreak paste preview print save searchreplace tabfocus table template toc visualblocks visualchars wordcount tiny_mce_wiris",
              toolbar: "",
              content_style: ""
            };

            for (var key in optionsSelected) {
              if (key.startsWith("allow")) {
                if (optionsSelected[key])
                  tinyMCEOptions.toolbar += " " + toolbarGroup[key];
              }
            }
            tinyMCEOptions.menubar = optionsSelected.showMenuBar;
            tinyMCEOptions.statusbar = optionsSelected.showStatusBar;
            tinyMCEOptions.content_style = optionsSelected.contentStyle;

            return JSON.stringify(tinyMCEOptions);
          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var optionsSelected = JSON.parse(attrs.options);
            var tinyMCEOptions = this.parseToTinyMCEOptions(optionsSelected);

            var templateDyn = '\
                  <textarea \
                    ui-tinymce="$options$" \
                    ng-model="$ngModel$" \
                    id="$id$" \
                    ng-cron-click="$ngClick$" \
                    ng-cron-dblclick="$ngDblclick$" \
                    ng-cron-mousedown="$ngMouseDown$" \
                    ng-cron-mouseup="$ngMouseUp$" \
                    ng-cron-mousemove="$ngMouseMove$" \
                    ng-cron-mouseover="$ngMouseOver$" \
                    ng-cron-mouseenter="$ngMouseEnter$" \
                    ng-cron-mouseleave="$ngMouseLeave$" \
                    ng-cron-keydown="$ngKeydown$" \
                    ng-cron-keyup="$ngKeyup$" \
                    ng-cron-keypress="$ngKeypress$"\
                    ng-context-menu="$ngContextMenu$" \
                    ng-cron-paste="$ngPaste$" \
                    ng-cron-init="$ngInit$" \
                    ng-cron-focus="$ngFocus$" \
                    ng-cron-blur="$ngBlur$" \
                    ng-before-set-content="$ngBeforeSetContent$" \
                    ng-set-content="$ngSetContent$" \
                    ng-get-content="$ngGetContent$" \
                    ng-pre-process="$ngPreProcess$" \
                    ng-post-process"$ngPostProcess$" \
                    ng-node-change="$ngNodeChange$" \
                    ng-cron-undo="$ngUndo$" \
                    ng-cron-redo="$ngRedo$" \
                    ng-cron-change="$ngChange$" \
                    ng-cron-dirty="$ngDirty$" \
                    ng-cron-remove="$ngRemove$" \
                    ng-exec-command="$ngExecCommand$" \
                    ng-paste-pre-process="$ngPastePreProcess$" \
                    ng-paste-post-process="$ngPastePostProcess$" \
                    ng-add-editor="$ngAddEditor$" \
                    ng-remove-editor="$ngRemoveEditor$"> \
                  </textarea> \
                ';
            templateDyn = $(templateDyn
                .split('$ngModel$').join(attrs.ngModel)
                .split('$ngClick$').join(attrs.ngCronClick || "")
                .split('$ngDblclick$').join(attrs.ngCronDblclick || "")
                .split('$ngMouseDown$').join(attrs.ngCronMouseDown || "")
                .split('$ngMouseUp$').join(attrs.ngCronMouseUp || "")
                .split('$ngMouseMove$').join(attrs.ngCronMouseMove|| "")
                .split('$ngMouseOver$').join(attrs.ngCronMouseOver|| "")
                .split('$ngMouseEnter$').join(attrs.ngCronMouseEnter|| "")
                .split('$ngMouseLeave$').join(attrs.ngCronMouseLeave|| "")
                .split('$ngKeydown$').join(attrs.ngCronKeydown|| "")
                .split('$ngKeyup$').join(attrs.ngCronKeyup|| "")
                .split('$ngKeypress$').join(attrs.ngCronKeypress|| "")
                .split('$ngContextMenu$').join(attrs.ngContextMenu|| "")
                .split('$ngPaste$').join(attrs.ngCronPaste|| "")
                .split('$ngInit$').join(attrs.ngCronInit|| "")
                .split('$ngFocus$').join(attrs.ngCronFocus|| "")
                .split('$ngBlur$').join(attrs.ngCronBlur|| "")
                .split('$ngBeforeSetContent$').join(attrs.ngBeforeSetContent|| "")
                .split('$ngSetContent$').join(attrs.ngSetContent|| "")
                .split('$ngGetContent$').join(attrs.ngGetContent|| "")
                .split('$ngPreProcess$').join(attrs.ngPreProcess|| "")
                .split('$ngPostProcess$').join(attrs.ngPostProcess|| "")
                .split('$ngNodeChange$').join(attrs.ngNodeChange|| "")
                .split('$ngUndo$').join(attrs.ngCronUndo|| "")
                .split('$ngRedo$').join(attrs.ngCronRedo|| "")
                .split('$ngChange$').join(attrs.ngCronChange|| "")
                .split('$ngDirty$').join(attrs.ngCronDirty|| "")
                .split('$ngRemove$').join(attrs.ngRemove|| "")
                .split('$ngExecCommand$').join(attrs.ngExecCommand|| "")
                .split('$ngPastePreProcess$').join(attrs.ngPastePreProcess|| "")
                .split('$ngPastePostProcess$').join(attrs.ngPastePostProcess|| "")
                .split('$ngAddEditor$').join(attrs.ngAddEditor|| "")
                .split('$ngRemoveEditor$').join(attrs.ngRemoveEditor|| "")
                .split('$id$').join(attrs.id || app.common.generateId())
                .split('$options$').join(escape(tinyMCEOptions))
            );

            var x = angular.element(templateDyn);
            element.html('');
            element.append(x);
            element.attr('id' , null);
            $compile(x)(scope);
          }
        };
      })
      .directive('cronReportViewer', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {

            function executeReport(attrsOptions) {
              var config = JSON.parse(attrsOptions);
              var contextVars = { 'element': element };
              scope.$eval(config.reportCommand, contextVars);
            }

            executeReport(attrs.options);

            var filterTimeout = null;
            scope.$watch(function(){ return attrs.options }, function(value, old){
              if (value !== old) {

                if (filterTimeout) {
                  clearInterval(filterTimeout);
                  filterTimeout = null;
                }

                filterTimeout = setTimeout(function() {
                  executeReport(value);
                }.bind(this), 500);
              }
            });


          }
        };
      })

      .directive('cronScheduler', ['$compile', '$translate', function($compile, $translate) {
        return {
          estrict: 'E',
          replace: true,
          initCulture: function() {
            var culture = $translate.use();
            culture = culture.replace(/_/gm, '-');
            var parts = culture.split('-');
            parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
            culture = parts.join('-');
            kendo.culture(culture);
          },
          getSchedulerModel: function(datasourceFields) {
            let model = {
              id: "id", // The "id" of the event is the "taskId" field
              fields: {}
            };
            for(let key in datasourceFields) {
              model.fields[key] = {from: datasourceFields[key].name};
            }
            return model
          },
          mergeSchedulerEventWithDatasourceActive: (datasource, item) => {
            //In order to merge the new event info with the active item from datasorce.
            return Object.assign(datasource.active, item);
          },
          setDatasourceActiveItem: function (datasource, item, keyField) {
            if (item) {
              for (let key in datasource.data) {
                let dsItem = datasource.data[key][keyField];
                if (dsItem !== null && dsItem === item[keyField]) {
                  datasource.active = datasource.copy(datasource.data[key], {});
                  return datasource.active;
                }
              }
              // If item is not present clean active
              datasource.startEditing({});
              return datasource.active;
            }
          },
          getSchedulerProperties: function(options, datasource, scope) {
            let schedulerStartDate = (options.initialDateStrategy === 'Expression' ? scope.$eval(generateBlocklyCall(options.initialDateBlocklyInfo)) : options.initialDate);
            let lastSearchedPeriod = {start: null, end: null};
            let needsToFetchData = function(searchablePeriod) {
              return !angular.equals(lastSearchedPeriod, searchablePeriod);
            };
            let visibleViews = [];
            if(options.views) {
              for(let viewIndex in options.views) {
                let view = options.views[viewIndex];
                if(view.visible) {
                  visibleViews.push(view);
                }
              }
            } else {
              if(options.showDayTab) {
                visibleViews.push('day');
              }
              if(options.showAgendaTab) {
                visibleViews.push('agenda');
              }
              if(options.showMonthTab) {
                visibleViews.push('month');
              }
              if(options.showTimelineTab) {
                visibleViews.push('timeline');
              }
              if(options.showWeekTab) {
                visibleViews.push('week');
              }
              if(options.showWorkWeekTab) {
                visibleViews.push('workWeek');
              }
            }


            let cronSchedulerProperties = {
              showWorkHours: options.showWorkHours,
              selectable: true,
              date: schedulerStartDate,
              mobile: true,
              allDaySlot: options.allDaySlot,
              timezone: "Etc/UTC", // Setting the timezone is recommended when binding to a remote service.
              currentTimeMarker: (options.currentTimeMarker ? {
                updateInterval: 10000,
                useLocalTimezone: false
              } : options.currentTimeMarker),
              views: visibleViews,
              navigate: function(e) {
                //Navigated from
                let view = e.sender.view();

                // The view has:
                // A startDate method which returns the start date of the view.
                // An endDate method which returns the end date of the view.

                //kendo.format("view:: start: {0:d}; end: {1:d};", view.startDate(), view.endDate())
              },
              dataBound: function(e) {
                //Navigated to
                let view = e.sender.view();

                // The view has:
                // A startDate method which returns the start date of the view.
                // An endDate method which returns the end date of the view.

                //kendo.format("view:: start: {0:d}; end: {1:d};", view.startDate(), view.endDate())
              },
              change: (e) => {
                if (e && e.events && e.events.length) {
                  this.setDatasourceActiveItem(datasource, e.events[0], 'id');
                } else {
                  datasource.startInserting({});
                }
                console.log('Active: ', datasource.active);
              },
              edit: function (e) {
                if (options && options.allowCustomAction) {
                  let container = e.container;

                  let btnLabel = options.customActionLabel ? options.customActionLabel : $translate.instant(Details);
                  /* ACTION: ADD custom button */
                  let detailButton = $('<a class="k-button">' + btnLabel + '</a>');

                  //wire its click event
                  detailButton.click(function (e) {
                    scope.safeApply(() => {
                      scope.$eval(generateBlocklyCall(options.customActionBlockly));
                    });
                  });

                  //add the button to the container
                  let buttonsContainer = container.find(".k-edit-buttons");
                  buttonsContainer.append(detailButton);
                }
              },
              dataSource: {
                batch: false, // Enable batch updates
                transport: {
                  read: function(read) {
                    read.data = read.data || {};
                    // verify if lastSearchedPeriod is the same searched now. If so ignore search.
                    if(needsToFetchData(read.data)) {
                      lastSearchedPeriod = read.data;

                      if(jQuery.isEmptyObject(read.data)) {
                        read.data[options.schedulerDataModel.start.name] = schedulerStartDate;
                      }
                      let paramsOData = kendo.data.transports.odata.parameterMap(read.data, 'read');
                      let orderBy = '';
                      let fetchData = {};
                      fetchData.params = paramsOData;
                      datasource.fetch(fetchData, {
                        success: function(data) {
                          read.success(angular.copy(data));
                        },
                        canceled: function(data) {
                          // notify the data source that the request failed
                          read.error(angular.copy(data));
                        }
                      }, false);
                    } else {
                      read.error();
                    }
                  }.bind(this),
                  update: (update) => {
                    let item = this.parseToDatasourceSchema(datasource, update.data);
                    datasource.startEditing(datasource.active);
                    this.mergeSchedulerEventWithDatasourceActive(datasource, item);
                    datasource.update(
                      datasource.active,
                      (data) => {
                        let updatedItem = angular.copy(data);
                        update.success(updatedItem);
                        datasource.fetch({}, {
                          success: (allData) => {
                            this.setDatasourceActiveItem(datasource, updatedItem, 'id');
                          },
                          canceled: (data) => {
                            // notify the data source that the request failed
                          }
                        }, false);
                      },
                      (data) => {
                        update.error(angular.copy(data));
                      }
                    );
                  },
                  create: (create) => {
                    let item = this.parseToDatasourceSchema(datasource, create.data);
                    this.mergeSchedulerEventWithDatasourceActive(datasource, item);
                    datasource.insert(
                      datasource.active,
                      (data) => {
                        let newItem = angular.copy(data);
                        create.success(newItem);
                        datasource.fetch({}, {
                          success: (allData) => {
                            this.setDatasourceActiveItem(datasource, newItem, 'id');
                          },
                          canceled: function(data) {
                            // notify the data source that the request failed
                          }
                        }, false);
                      },
                      (data) => {
                        create.error(angular.copy(data));
                      }
                    );
                  },
                  destroy: function(destroy) {
                    datasource.removeSilent(
                        this.parseToDatasourceSchema(datasource, destroy.data),
                        function(data) {
                          destroy.success(angular.copy(data));
                        },
                        function(data) {
                          destroy.error(angular.copy(data));
                        }
                    );
                  }.bind(this)
                },
                schema: {
                  model: this.getSchedulerModel(options.schedulerDataModel)
                }
              }
            };
            if(!options.views) {
              cronSchedulerProperties.editable = options.editable;
            }
            return cronSchedulerProperties;
          },
          showError: function(scope, title, message) {
            let info = {
              message: message,
              title: title,
              delay: null
            };
            scope.Notification.error(info);
          },
          parseToDatasourceSchema: function(datasource, object) {
            let parsedObj = {};
            for(let key in datasource.schema) {
              let name = datasource.schema[key].name;
              parsedObj[name] = (object[name] ? object[name] : null);
            }
            return parsedObj;
          },
          link: function(scope, element, attrs, ngModelCtrl) {
            let schedulerElement = $('<div></div>');
            let options = JSON.parse(attrs.options || "{}");
            let datasource;
            if(options.dataSourceScreen && options.dataSourceScreen.entityDataSource) {
              datasource = eval(options.dataSourceScreen.entityDataSource.name);
            }
            //Validate Component Configuration
            if(!datasource) {
              // There is no Datasource
              let errorObject = {};
              $translate('DatasourceNotFoundMessage').then((datasourceNotFoundMessage) => {
                errorObject.message = datasourceNotFoundMessage;
              return $translate('Scheduler');
            }).then((scheduler) => {
                errorObject.component = scheduler;
              return $translate('DatasourceNotFoundTitle');
            }).then((datasourceNotFoundTitle) => {
                errorObject.title = datasourceNotFoundTitle;
              this.showError(scope, errorObject.title, errorObject.message.replace('{0}', errorObject.component));
            });
              return;
            }else if(jQuery.isEmptyObject(options.schedulerDataModel)){
              //TODO ADD Message to not relation fields added
              return;
            }

            let baseUrl = 'plugins/cronapp-lib-js/dist/js/kendo-ui/js/messages/kendo.messages.';
            if($translate.use() === 'pt_br') {
              baseUrl += "pt-BR.min.js";
            } else {
              baseUrl += "en-US.min.js";
            }

            this.initCulture();

            $.getScript(baseUrl, function() {

              let kendoDatasource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, true, options.dataSourceScreen.rowsPerPage);

              let schedulerProperties = this.getSchedulerProperties(options, datasource, scope);

              schedulerElement.kendoScheduler(schedulerProperties);

              // Get reference to the kendo.ui.Scheduler instance
              let scheduler = schedulerElement.data("kendoScheduler");
              let lastView;

              scheduler.bind('navigate', function(e) {
                scheduler._previousView = e.sender.view();
              });
              scheduler.bind('dataBound', function(e) {
                scheduler._currentView = e.sender.view();
                if(scheduler._previousView) {
                  let sameView = compare(scheduler._previousView._dates, scheduler._currentView._dates);
                  if(!sameView) {
                    let params = {};
                    params[options.schedulerDataModel.start.name] = scheduler._currentView._startDate;
                    params[options.schedulerDataModel.end.name] = scheduler._currentView._endDate;
                    scheduler.dataSource.read(params);
                    scheduler._previousView = scheduler._currentView;
                  }
                }

              });

              function compare(arr1, arr2) {
                if(!arr1 || !arr2) return
                let result;
                arr1.forEach((e1, i) => arr2.forEach(e2 => {
                  if(e1.getTime() !== e2.getTime()) {
                  result = false
                } else {
                  result = true
                }
              }));
                return result
              }
            }.bind(this));

            element.html(schedulerElement);
            $compile(schedulerElement)(element.scope());
          }
        }
      }])

      .directive('cronGrid', ['$compile', '$translate', function($compile, $translate) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          initCulture: function() {
            var culture = $translate.use();
            culture = culture.replace(/_/gm,'-');
            var parts = culture.split('-');
            parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
            culture = parts.join('-');
            kendo.culture(culture);
          },
          generateToolbarButtonCall: function(toolbarButton, scope, options) {
            var buttonCall;
            var generateObjTemplate = function(functionToCall, title, iconClass) {
              var obj = {
                template: function() {
                  var buttonId = app.common.generateId();
                  return createTemplateButton(buttonId, functionToCall, title, iconClass);
                }.bind(this)
              };
              return obj;
            }.bind(this);

            var createTemplateButton = function(buttonId, functionToCall, title, iconClass) {
              var template = '';
              if (toolbarButton.type == "SaveOrCancelChanges") {
                if (toolbarButton.saveButton)
                  template = '<a role="button" class="saveorcancelchanges k-button k-button-icontext k-grid-save-changes" id="#BUTTONID#" href="javascript:void(0)"><span class="k-icon k-i-check"></span>#TITLE#</a>';
                else
                  template = '<a role="button" class="saveorcancelchanges k-button k-button-icontext k-grid-cancel-changes" id="#BUTTONID#" href="javascript:void(0)"><span class="k-icon k-i-cancel" ></span>#TITLE#</a>';
              }
              else if (toolbarButton.type == "Blockly" || toolbarButton.type == "Customized") {
                template = '<a class="k-button k-grid-custom" id="#BUTTONID#" href="javascript:void(0)"><span class="#ICONCLASS#" ></span>#TITLE#</a>';
              }
              else if (toolbarButton.type == "Native" && toolbarButton.title == 'create') {
                template = '<a role="button" id="#BUTTONID#" class="k-button k-button-icontext k-grid-add" href="javascript:void(0)"><span class="k-icon k-i-plus"></span>{{"Add" | translate}}</a>';
              }

              template = template
                  .split('#BUTTONID#').join(buttonId)
                  .split('#FUNCTIONCALL#').join(this.encodeHTML(functionToCall))
                  .split('#TITLE#').join(title)
                  .split('#ICONCLASS#').join(iconClass);

              var cronappDatasource = eval(options.dataSourceScreen.entityDataSource.name);

              var waitRender = setInterval(function() {
                if ($('#' + buttonId).length > 0) {
                  scope.safeApply(function() {
                    var x = angular.element($('#' + buttonId ));
                    $compile(x)(scope);
                  });

                  $('#' + buttonId).click(function() {

                    var currentGrid = options.grid;
                    var selectedRows = [];
                    currentGrid.select().each(function() {
                      var gridRow = currentGrid.dataItem(this);
                      cronappDatasource.data.forEach(function(dsRow) {
                        if (dsRow.__$id == gridRow.__$id)
                          selectedRows.push(dsRow);
                      });
                    });

                    var consolidated = {
                      item: cronappDatasource.active,
                      index: cronappDatasource.cursor
                    }
                    var contextVars = {
                      'currentData': cronappDatasource.data,
                      'datasource': cronappDatasource,
                      'selectedIndex': cronappDatasource.cursor,
                      'index': cronappDatasource.cursor,
                      'selectedRow': cronappDatasource.active,
                      'consolidated': consolidated,
                      'item': cronappDatasource.active,
                      'selectedKeys': cronappDatasource.getKeyValues(cronappDatasource.active, true),
                      'selectedRows': selectedRows
                    };

                    scope.$eval(functionToCall, contextVars) ;
                  }.bind(this));

                  clearInterval(waitRender);
                }
              }.bind(this),200);

              return template;
            }.bind(this);

            var call = '';
            if (toolbarButton.type == 'Customized')
              call = toolbarButton.execute;
            else if (toolbarButton.methodCall)
              call = toolbarButton.methodCall;
            else
              call = generateBlocklyCall(toolbarButton.blocklyInfo);

            var title = toolbarButton.title == undefined ? '': toolbarButton.title;
            buttonCall = generateObjTemplate(call, title, toolbarButton.iconClass);
            return buttonCall;
          },
          generateModalSaveOrCancelButtonCall: function(buttonType, functionToCall, datasourceName, modalId, scope) {

            var buttonId = app.common.generateId();
            var compileTemplateAngular = function(buttonType, functionToCall, datasourceName, modalId) {
              var template;
              if (buttonType == 'save')
                template = '<button id="#BUTTONID#" class="btn btn-primary btn-fab ng-binding grid-save-button-modal k-button" data-component="crn-button" ng-click="#FUNCTIONCALL#" onclick="(!#DATASOURCENAME#.missingRequiredField()?$(\'##MODALID#\').modal(\'hide\'):void(0))"><span class="k-icon k-i-check"></span></button>';
              else
                template = '<button id="#BUTTONID#" type="button" class="btn btn-default btn-fab ng-binding k-button" data-component="crn-button" data-dismiss="modal"><span class="k-icon k-i-cancel"></span></button>'
              template = template
                  .split('#BUTTONID#').join(buttonId)
                  .split('#FUNCTIONCALL#').join(functionToCall)
                  .split('#DATASOURCENAME#').join(datasourceName)
                  .split('#MODALID#').join(modalId);

              var waitRender = setInterval(function() {
                if ($('#' + buttonId).length > 0) {
                  scope.safeApply(function() {
                    var x = angular.element($('#' + buttonId ));
                    $compile(x)(scope);
                    clearInterval(waitRender);
                  });
                }
              },200);

              return template;
            };
            buttonCall = compileTemplateAngular(buttonType, functionToCall, datasourceName, modalId);
            return buttonCall;
          },
          addButtonsInModal: function(modal, datasourceName, scope) {
            var $footerModal = $('#' + modal).find('.modal-footer');
            if (!$footerModal.find('.grid-save-button-modal').length) {
              var functionToCall = datasourceName + '.post();'
              var buttonSave = this.generateModalSaveOrCancelButtonCall('save', functionToCall, datasourceName, modal, scope);
              $footerModal.append(buttonSave);
              var buttonCancel = this.generateModalSaveOrCancelButtonCall('cancel', null, null, null, scope);
              $footerModal.append(buttonCancel);
            }
          },
          getObjectId: function(obj) {
            if (!obj)
              obj = "";
            else if (obj instanceof Date) {
              var momentDate = moment.utc(obj);
              obj = new Date(momentDate.format('YYYY-MM-DDTHH:mm:ss'));
            }
            else if (typeof obj === 'object') {
              //Verifica se tem id, senão pega o primeiro campo
              if (obj["id"])
                obj = obj["id"];
              else {
                for (var key in obj) {
                  obj = obj[key];
                  break;
                }
              }
            }
            return obj;
          },
          encodeHTML: function(value){
            return value.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
          },
          decodeHTML: function(value){
            return value.replace(/&apos;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
          },
          getColumnByField: function(options, fieldName) {
            var selected = null;
            options.columns.forEach(function(column)  {
              if (column.field == fieldName)
                selected = column;
            });
            return selected;
          },
          getColumns: function(options, datasource, scope, tooltips) {
            var directiveContext = this;

            function getTemplate(column) {
              var template = "#=showTreatedValue("+column.field+")#";
              if (column.inputType == 'switch') {
                template =
                    '<span class="k-switch km-switch k-widget km-widget k-switch-off km-switch-off" style="width: 100%">\
                  <span class="k-switch-wrapper km-switch-wrapper">\
                    <span class="k-switch-background km-switch-background" style="margin-left: #=' + column.field + ' ? "80%": "0%" #"></span>\
                  </span>\
                  <span class="k-switch-container km-switch-container">\
                    <span class="k-switch-handle km-switch-handle" style=#=' + column.field + ' ? "float:right;margin-right:-1px": "margin-left:0%" #>\
                    </span>\
                  </span>\
                </span>';
              }
              else if (column.inputType == 'checkbox' || column.type == 'boolean') {
                template = "<input crn-set-indeterminate=#=" + column.field + "# type='checkbox' class='k-checkbox' #=" + column.field + " ? \"checked='checked'\": '' # />" +
                    "<label class='k-checkbox-label k-no-text'></label>"
              }
              else if (column.displayField && column.displayField.length > 0) {
                if (hasMask(column.type) || (column.format && column.format != 'null')) {
                  template = "#= useMask("+column.displayField+",'"+column.format+"','"+column.type+"') #";
                }
                else {
                  template = "#="+column.displayField+"#";
                }
              }
              else if (hasMask(column.type) || (column.format && column.format != 'null')   ) {
                template = "#= useMask("+column.field+",'"+column.format+"','"+column.type+"') #";
              }
              return template;
            }

            function hasMask(type){
              if(type && (typeof type === "string")){
                return (type.startsWith('date') || type.startsWith('month')
                    || type.startsWith('time') || type.startsWith('week')
                    || type.startsWith('money') || type.startsWith('number')
                    || type.startsWith('tel') || type.startsWith('integer'));
              }else{
                return false;
              }
            }

            function getFormat(column) {
              if (!hasMask(column.type))
                return column.format;
              return undefined;
            }

            function isRequired(fieldName) {
              var required = false;
              var selected = null;
              if (datasource.schema.model.fields[fieldName]){
                selected = datasource.schema.model.fields[fieldName];
              }
              if (selected)
                required = !selected.nullable;
              return required;
            }

            function getEditor(column) {
              return editor.bind(this);
            }

            function editor(container, opt) {

              var column = this.getColumnByField(options, opt.field);
              if (column.visibleCrud != undefined && !column.visibleCrud) {
                container.parent().find('.k-edit-label [for='+ column.field +']').parent().remove();
                container.remove();
              }
              var required = isRequired(opt.field) ? "required" : "";
              var buttonId = app.common.generateId();
              var $input = $('<input '+required+' name="' + opt.field + '" id="' + buttonId + '"from-grid=true />');
              if (column.inputType == 'dynamicComboBox' || column.inputType == 'comboBox') {
                var kendoConfig = app.kendoHelper.getConfigCombobox(column.comboboxOptions, scope);
                kendoConfig.autoBind = true;
                kendoConfig.optionLabel = undefined;
                if (column.displayField) {
                  kendoConfig.change = function(e) {
                    opt.model.set(column.displayField, this.text());
                    opt.model.dirty = true;
                    opt.model.dirtyFields[column.displayField] = true;
                  }
                }
                $input.appendTo(container).kendoDropDownList(kendoConfig, scope);
              }
              else if (column.inputType == 'slider') {
                var kendoConfig = app.kendoHelper.getConfigSlider(column.sliderOptions);
                $input.appendTo(container).kendoSlider(kendoConfig, scope);
              }
              else if (column.inputType == 'switch') {
                var kendoConfig = app.kendoHelper.getConfigSwitch(column.switchOptions);
                $input.appendTo(container).kendoMobileSwitch(kendoConfig, scope);
              }
              else if (column.inputType == 'checkbox' || column.type == 'boolean') {
                var guid = app.common.generateId();
                $input = $('<input id="'+guid+'" name="' + opt.field + '" class="k-checkbox" type="checkbox" ><label class="k-checkbox-label" for="'+guid+'"></label>');
                $input.appendTo(container);
              }
              else if (column.inputType == 'date') {
                $input.attr('cron-date', '');
                $input.attr('options', JSON.stringify(column.dateOptions));
                $input.data('initial-date', opt.model[opt.field]);
                $input.appendTo(container).off('change');
                var waitRender = setInterval(function() {
                  if ($('#' + buttonId).length > 0) {
                    var x = angular.element($('#' + buttonId ));
                    $compile(x)(scope);
                    clearInterval(waitRender);

                    $('#' + buttonId).on('change', function() {
                      setTimeout(function() {
                        opt.model[opt.field] = $('#' + buttonId ).data('rawvalue');
                        opt.model.dirty = true;
                        opt.model.dirtyFields[opt.field] = true;
                      }.bind(this));

                    });
                  }
                },10);
              }
              else {
                $input.attr('type', column.type);
                $input.attr('mask', column.format ? column.format : '');
                $input.attr('class', 'k-input k-textbox');
                $input.data('initial-value', opt.model[opt.field]);
                $input.appendTo(container);

                var waitRender = setInterval(function() {
                  let myElement = $('#' + buttonId);
                  if (myElement.length > 0) {
                    myElement.off('change');
                    myElement.on('change', function() {
                      let rawValue = myElement.data('rawvalue');
                      let value = myElement.val();
                      opt.model[opt.field] = rawValue || value;
                      opt.model.dirty = true;
                      opt.model.dirtyFields[opt.field] = true;
                    });

                    var x = angular.element(myElement);
                    $compile(x)(scope);
                    clearInterval(waitRender);
                  }
                },10);
              }

            }

            function getCommandForEditButtonDatabase(opt, command) {
              var cmd;
              if ((opt.editable == 'popupCustom') || (opt.editable == 'datasource')) {
                cmd = {
                  name: app.common.generateId(),
                  text: '',
                  iconClass: "k-icon k-i-edit",
                  className: "k-grid-edit",
                  click: function(e) {
                    e.preventDefault();
                    var tr = $(e.target).closest("tr");
                    var grid = tr.closest('table');
                    var item = this.dataItem(tr);
                    var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                    scope.safeApply(function() {
                      if (!options.hideModalButtons) {
                        directiveContext.addButtonsInModal(options.popupEdit, cronappDatasource.name, scope);
                      }

                      var currentItem = cronappDatasource.goTo(item);
                      cronappDatasource.startEditing(currentItem, function(xxx) {});
                      if (opt.editable != 'datasource') {
                        cronapi.screen.showModal(options.popupEdit);
                      }
                    });
                    return;
                  }
                };
              }
              else {
                cmd = {
                  name: command,
                  text: { edit: " ", update: " ", cancel: " " }
                };
              }
              return cmd;
            }

            function getCommandForRemoveButtonDatabase(opt, command) {
              var cmd;
              if ((opt.editable == 'popupCustom') || (opt.editable == 'datasource')) {
                cmd = {
                  name: app.common.generateId(),
                  text: '',
                  iconClass: "k-icon k-i-close",
                  className: "k-grid-delete",
                  click: function(e) {
                    e.preventDefault();
                    var tr = $(e.target).closest("tr");
                    var item = this.dataItem(tr);
                    var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                    var self = this;
                    scope.safeApply(function() {
                      var currentItem = cronappDatasource.goTo(item);
                      var fn;
                      if (cronappDatasource.active.__status && cronappDatasource.active.__status == 'inserted') {
                        fn = function(e) {
                          self.dataSource.remove(item);
                        }
                      }

                      cronappDatasource.remove(currentItem, fn);
                    });
                  }
                };
              } else {
                cmd = {
                  name: command,
                  text: " "
                };
              }
              return cmd;
            }

            function getAggregate(column) {
              if (column && column.aggregates) {
                var aggregates = [];
                column.aggregates.forEach(function(a) {
                  aggregates.push(a.type);
                });
                if (aggregates.length > 0)
                  return aggregates;
              }
              return undefined;
            }

            function getAggregateFooter(column, group) {
              if (column && column.aggregates) {
                var footer = [];
                column.aggregates.forEach(function(a) {

                  var typeForLabel = '#=data.' + column.field + ' ? data.' + column.field + '.' + a.type + ' : 0 #';
                  if (a.type == 'average' || a.type == 'sum') {
                    typeForLabel = "#=useMask(data." + column.field  + " ? data." + column.field + "." + a.type + " : 0" + ",'" + column.format + "','" + column.type + "')#";
                  }

                  var typeForTemplate = group ? a.groupFooterTemplate : a.footerTemplate;

                  if (typeForTemplate) {
                    typeForTemplate = typeForTemplate + ': ';
                  } else {
                    typeForTemplate = '';
                  }

                  var footerTemplate = typeForTemplate + typeForLabel;

                  if (column.alignment) {
                    // alinha o rodapé ao conteúdo quando o alinhamento selecionado for 'Direita'
                    if (column.alignment === 'right' && !group) {
                      footerTemplate = '<div style="text-align: ' + column.alignment + '" class="k-fix-margin">' + footerTemplate + '</div>';
                    } else {
                      footerTemplate = '<div style="text-align: ' + column.alignment + '">' + footerTemplate + '</div>';
                    }
                  }

                  footer.push(footerTemplate);
                });
                return footer.join('<br/>');
              }
              return undefined;
            }

            function getAggregateHeader(column) {
              if (hasMask(column.type) || (column.format && column.format != 'null')) {
                return column.headerText +": #=useMask(value,'"+column.format+"','"+column.type+"')#";
              }
              return undefined;
            }

            function getAttributes(column) {
              if (column && column.alignment) {
                var attributes = {
                  style: "text-align: " + column.alignment + ";"
                };

                return attributes;
              }
              return undefined;
            }

            var columns = [];
            if (options.columns) {
              options.columns.forEach(function(column)  {
                if (column.dataType == "Database") {

                  var addColumn = {
                    field: column.field,
                    title: column.headerText,
                    type: column.type,
                    width: column.width,
                    sortable: column.sortable,
                    filterable: column.filterable,
                    hidden: !column.visible
                  };
                  addColumn.template = getTemplate(column);
                  addColumn.format = getFormat(column);
                  addColumn.editor = getEditor.bind(this)(column);
                  addColumn.aggregates = getAggregate(column);
                  addColumn.footerTemplate = getAggregateFooter(column, false);
                  addColumn.groupFooterTemplate = getAggregateFooter(column, true);
                  addColumn.groupHeaderTemplate = getAggregateHeader(column);
                  addColumn.attributes = getAttributes(column);
                  addColumn.headerAttributes = addColumn.attributes;
                  columns.push(addColumn);
                }
                else if (column.dataType == "Command") {
                  //Se não for editavel, não adiciona colunas de comando
                  if (options.editable != 'no') {
                    var command = column.command.split('|');

                    var commands = [];
                    command.forEach(function(f) {
                      var cmd;
                      if ( f == "edit") {
                        cmd = getCommandForEditButtonDatabase.bind(this)(options, f);
                      }
                      else {
                        cmd = getCommandForRemoveButtonDatabase.bind(this)(options, f);
                      }
                      commands.push(cmd);
                    }.bind(this));

                    var addColumn = {
                      command: commands,
                      title: column.headerText,
                      width: column.width ? column.width : 155,
                      hidden: !column.visible
                    };
                    columns.push(addColumn);
                  }
                }
                else if (column.dataType == "Blockly" || column.dataType == "Customized" || column.dataType == "CustomizedLink") {
                  var label = column.label == undefined ? '': column.label;
                  if (column.iconClass && label)
                    label = '&nbsp;' + label;

                  var className = '';
                  if (column.dataType == "CustomizedLink") {
                    className = 'k-custom-link';
                  }
                  else {
                    className = 'k-custom-command' + (label ? ' k-button-with-label' : '');
                  }
                  if (column.theme)
                    className += ' ' + column.theme;

                  var tooltip = '';
                  if (column.tooltip && column.tooltip.length)
                    tooltip = column.tooltip;
                  else if (column.label && column.label.length)
                    tooltip = column.label;

                  if (tooltip)  {
                    var classForTooltip = app.common.generateId();
                    tooltips[classForTooltip] = tooltip;
                    className += ' ' + classForTooltip;
                  }

                  var addColumn = {
                    command: [{
                      name: app.common.generateId(),
                      text: label,
                      hidden: !column.visible,
                      className: className,
                      iconClass: column.iconClass,
                      click: function(e) {
                        e.preventDefault();
                        var tr = $(e.target).closest("tr");
                        var grid = tr.closest('table');

                        var item = this.dataItem(tr);
                        var index = $(grid.find('tbody')[0]).children().index(tr)
                        var consolidated = {
                          item: item,
                          index: index
                        }

                        var call = undefined;
                        if (column.dataType == "Customized" || column.dataType == "CustomizedLink")
                          call = column.execute;
                        else
                          call = generateBlocklyCall(column.blocklyInfo);

                        var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                        var currentGrid = options.grid;
                        var selectedRows = [];
                        currentGrid.select().each(function() {
                          var gridRow = currentGrid.dataItem(this);
                          cronappDatasource.data.forEach(function(dsRow) {
                            if (dsRow.__$id == gridRow.__$id)
                              selectedRows.push(dsRow);
                          });
                        });

                        if (!(cronappDatasource.inserting || cronappDatasource.editing)) {
                          var tr = e.currentTarget.parentElement.parentElement;
                          this.select(tr);
                        }

                        var contextVars = {
                          'currentData': cronappDatasource.data,
                          'datasource': cronappDatasource,
                          'selectedIndex': index,
                          'index': index,
                          'selectedRow': item,
                          'consolidated': consolidated,
                          'item': item,
                          'selectedKeys': cronappDatasource.getKeyValues(cronappDatasource.active, true),
                          'selectedRows': selectedRows
                        };

                        scope.$eval(call, contextVars);
                        return;
                      }
                    }],
                    width: column.width,
                    title: column.headerText ? column.headerText: '',
                    hidden: !column.visible
                  };
                  columns.push(addColumn);
                }
                else if (column.dataType == "Selectable") {
                  var checkColumn = {
                    selectable: true
                  };
                  columns.push(checkColumn);
                }
              }.bind(this));
            }

            return columns;
          },
          getPageAble: function(options) {
            var pageable = {
              refresh:  options.allowRefreshGrid,
              pageSizes: options.allowSelectionTotalPageToShow,
              buttonCount: 5
            };

            if (!options.allowPaging)
              pageable = options.allowPaging;

            return pageable;
          },
          getToolbar: function(options, scope) {
            var toolbar = [];

            options.toolBarButtons.forEach(function(toolbarButton) {
              if (toolbarButton.type == "Native") {
                //Se a grade for editavel, adiciona todos os commands
                if (options.editable != 'no') {
                  if ((options.editable == 'datasource' || options.editable == 'popupCustom') &&  toolbarButton.title == 'create') {
                    var datasourceName = options.dataSourceScreen.name;
                    var popupInsert = options.popupInsert;
                    toolbarButton.methodCall = datasourceName + ".startInserting();";
                    if (options.editable == 'popupCustom') {
                      toolbarButton.methodCall = toolbarButton.methodCall + " cronapi.screen.showModal('"+popupInsert+"');";
                    }
                    var button = this.generateToolbarButtonCall(toolbarButton, scope, options);
                    toolbar.push(button);

                    if (!options.hideModalButtons) {
                      this.addButtonsInModal(popupInsert, datasourceName, scope);
                    }
                  }
                  else
                    toolbar.push(toolbarButton.title);
                }
                //Senão, adiciona somente commands que não sejam de crud
                else {
                  if (toolbarButton.title == "pdf" || toolbarButton.title == "excel") {
                    toolbar.push(toolbarButton.title);
                  }
                }
              }
              else if (toolbarButton.type == "Blockly" || toolbarButton.type == "Customized") {
                var buttonBlockly = this.generateToolbarButtonCall(toolbarButton, scope, options);
                toolbar.push(buttonBlockly);
              }
              else if (toolbarButton.type == "SaveOrCancelChanges") {
                if (options.editable != 'no') {
                  var buttonSaveOrCancel = this.generateToolbarButtonCall(toolbarButton, scope, options);
                  toolbar.push(buttonSaveOrCancel);
                }
              }
              else if (toolbarButton.type == "Template" || toolbarButton.type == "Title") {
                var buttonTemplate =  {
                  template: toolbarButton.template
                };
                toolbar.push(buttonTemplate);
              }

            }.bind(this));

            if (toolbar.length == 0)
              toolbar = undefined;
            return toolbar;
          },
          getEditable: function(options) {
            var editable = {
              mode:  options.editable,
              confirmation: false
            };
            if (options.editable == 'batch') {
              editable = true;
            }
            else if (options.editable == 'no' || options.editable == 'popupCustom' || options.editable == 'datasource') {
              editable = false;
            }
            return editable;
          },
          getTooltipsDefault: function() {
            var tooltips = {
              k_grid_edit : $translate.instant('Edit'),
              k_grid_delete: $translate.instant('Remove'),
              k_grid_update: $translate.instant('Save'),
              k_grid_cancel: $translate.instant('Cancel')
            };
            return tooltips;
          },
          setTooltips: function($divContainer, tooltips) {
            for (var key in tooltips) {
              var classFilter = '.' + key.replace(/_/g,'-');
              $divContainer.kendoTooltip({
                filter: classFilter,
                content: function(e){
                  var classKey = e.sender.options.filter.substr(1).replace(/-/g,'_');
                  return tooltips[classKey];
                }
              });
            }
          },
          generateKendoGridInit: function(options, scope, ngModelCtrl, attrs, tooltips) {

            var helperDirective = this;
            function detailInit(e) {
              //Significa que está fechando o detalhe (não é para fazer nada)
              if (e.masterRow.find('a').hasClass('k-i-expand')) {
                collapseCurrent(this, e.detailRow, e.masterRow);
                return;
              }

              var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
              if (!(cronappDatasource.inserting || cronappDatasource.editing)) {
                if (this.selectable) {
                  this.select(e.masterRow);
                }
                else {
                  setToActiveInCronappDataSource.bind(this)(e.data);
                  collapseAllExcecptCurrent(this, e.detailRow, e.masterRow);
                }
                //Obtendo todos os detalhes da grade atual, fechando e removendo todos (exceto o que esta sendo aberto agora)
                e.sender.options.listCurrentOptions.forEach(function(currentOptions) {
                  var currentKendoGridInit = helperDirective.generateKendoGridInit(currentOptions, scope, undefined, undefined, tooltips);

                  var $gridDiv = $("<div/>");
                  var grid = $gridDiv.appendTo(e.detailCell).kendoGrid(currentKendoGridInit).data('kendoGrid');
                  grid.dataSource.transport.options.grid = grid;
                  currentOptions.grid = grid;

                  helperDirective.setTooltips($gridDiv, tooltips);
                });
              }
              else
                collapseAllExcecptCurrent(this, null, null);


            }

            var collapseAllExcecptCurrent = function(grid, trDetail, trMaster) {

              var masters = grid.table.find('.k-master-row');
              masters.each(function() {
                if (trMaster == null || this != trMaster[0]) {
                  grid.collapseRow(this);
                }
              });

              var details = grid.table.find('.k-detail-row');
              details.each(function() {
                if (trDetail == null || this != trDetail[0]) {
                  $(this).remove();
                }
              });

            };

            var collapseCurrent = function(grid, trDetail, trMaster) {

              var masters = grid.table.find('.k-master-row');
              masters.each(function() {
                if (trMaster != null || this == trMaster[0]) {
                  grid.collapseRow(this);
                }
              });

              var details = grid.table.find('.k-detail-row');
              details.each(function() {
                if (trDetail != null || this == trDetail[0]) {
                  $(this).remove();
                }
              });

            };

            var setToActiveInCronappDataSource = function(item) {
              var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
              if (!(cronappDatasource.inserting || cronappDatasource.editing))
                scope.safeApply(cronappDatasource.goTo(item));
            };

            var compileListing = function(e) {
              if (e.sender.tbody && e.sender.tbody.length) {

                var toCompile = e.sender.tbody;
                if (toCompile.parent() && toCompile.parent().parent() && toCompile.parent().parent().parent() )
                  toCompile = toCompile.parent().parent().parent();

                scope.safeApply(function() {
                  var trs = $(toCompile);
                  var x = angular.element(trs);
                  $compile(x)(scope);
                });
              }
            };

            var anyFilterableColumn = function(options) {
              var hasFilterableColumn = false;
              if (options.columns) {
                for (var i = 0; i<options.columns.length; i++) {
                  if (options.columns[i].dataType == "Database") {
                    if (options.columns[i].filterable){
                      hasFilterableColumn = true;
                      break;
                    }
                  }
                }
              }
              return hasFilterableColumn;
            };

            var getVisibleColumnByIdx = function(idx) {
              var result;
              var currIdx = 0;
              options.columns.forEach(function(column)  {
                if (column.dataType == "Database") {
                  if (currIdx == idx && column.visible) {
                    result = column;
                  }
                  if (column.visible)
                    currIdx++;
                }
              });
              return result;
            };

            var excelExport = function(e) {
              var sheet = e.workbook.sheets[0];

              for (var rowIndex = 1; rowIndex < sheet.rows.length; rowIndex++) {
                var row = sheet.rows[rowIndex];
                for (var cellIndex = 0; cellIndex < row.cells.length; cellIndex ++) {

                  var column = getVisibleColumnByIdx(cellIndex);
                  //Formata pro excel e adiciona o timezone
                  if (column && row.cells[cellIndex].value instanceof Date) {
                    var dateValue = new Date(row.cells[cellIndex].value.getTime());
                    dateValue.setMinutes(dateValue.getMinutes() + dateValue.getTimezoneOffset());
                    dateValue.setSeconds(dateValue.getSeconds() + 4);
                    row.cells[cellIndex].value = dateValue;
                    if (column.type == 'time')
                      row.cells[cellIndex].format = "[$-x-systime]hh:mm:ss";
                    else if (column.type == 'datetime')
                      row.cells[cellIndex].format = "dd/mm/yyyy hh:mm:ss;@";
                  }
                }
              }
            };

            var datasource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, options.allowPaging, options.pageCount, options.columns, options.groupings);

            var columns = this.getColumns(options, datasource, scope, tooltips);
            var pageAble = this.getPageAble(options);
            var toolbar = this.getToolbar(options, scope);
            var editable = this.getEditable(options);
            var filterable = anyFilterableColumn(options);

            var kendoGridInit = {
              toolbar: toolbar,
              pdf: {
                allPages: true,
                avoidLinks: true,
                paperSize: "A4",
                margin: { top: "2cm", left: "1cm", right: "1cm", bottom: "1cm" },
                landscape: true,
                repeatHeaders: true,
                scale: 0.8
              },
              dataSource: datasource,
              editable: editable,
              height: options.height,
              groupable: options.allowGrouping,
              sortable: options.allowSorting,
              filterable: true,
              pageable: pageAble,
              columns: columns,
              selectable: options.allowSelectionRow,
              detailInit: (options.details && options.details.length > 0) ? detailInit : undefined,
              listCurrentOptions: (options.details && options.details.length > 0) ? options.details : undefined,
              excelExport: excelExport,
              edit: function(e) {
                this.dataSource.transport.options.disableAndSelect(e);
                var container = e.container;
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                if (e.model.isNew() && !e.model.dirty) {
                  var model = e.model;
                  cronappDatasource.startInserting(null, function(active) {
                    for (var key in active) {
                      if (model.fields[key]) {
                        if (model.fields[key].validation && model.fields[key].validation.required) {
                          var input = container.find("input[name='" + key + "']");
                          if (input.length) {
                            //TODO: Verificar com a telerik https://stackoverflow.com/questions/22179758/kendo-grid-using-model-set-to-update-the-value-of-required-fields-triggers-vali
                            input.val(active[key]).trigger('change');
                          }
                        }
                        model.set(key, active[key]);
                      }
                    }
                  });
                }
                else if (!e.model.isNew() && !e.model.dirty) {
                  scope.safeApply(function() {
                    var currentItem = cronappDatasource.goTo(e.model);
                    cronappDatasource.startEditing(currentItem, function(xxx) {});
                  });
                }

                if (attrs && attrs.ngEdit) {
                  scope.$eval(attrs.ngEdit);
                }

                compileListing(e);
              },
              change: function(e) {
                var item = this.dataItem(this.select());
                setToActiveInCronappDataSource.bind(this)(item);
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                if (ngModelCtrl) {
                  ngModelCtrl.$setViewValue(cronappDatasource.active);
                }
                collapseAllExcecptCurrent(this, this.select().next(), this.select());

                if (attrs && attrs.ngChange) {
                  scope.$eval(attrs.ngChange);
                }

                compileListing(e);
              },
              cancel: function(e) {
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                scope.safeApply(cronappDatasource.cancel());
                this.dataSource.transport.options.enableAndSelect(e);
                setTimeout(function() {
                  if (attrs && attrs.ngCancel) {
                    scope.$eval(attrs.ngCancel);
                  }

                  compileListing(e);
                }.bind(this));
              },
              dataBound: function(e) {
                this.dataSource.transport.options.selectActiveInGrid();

                if (attrs && attrs.ngDataBound) {
                  scope.$eval(attrs.ngDataBound);
                }

                for(let i=0;i<this.columns.length;i++){
                  let col = helperDirective.getColumnByField(options, this.columns[i].field);
                  if (col.visible)
                    this.showColumn(i);
                }
                if ($('div.k-grouping-header').length == 0) {
                  if (options.groupings) {
                    options.groupings.forEach((c) => this.hideColumn(c.field));
                  }
                }
                else {
                  $("div.k-group-indicator").each((i,v) => {
                    this.hideColumn($(v).data("field"));
                });
                }
                compileListing(e);
              }
            };

            if (kendoGridInit.selectable) {
              if ("multiple" == options.allowSelectionRowType) {
                kendoGridInit.selectable = "multiple"
              }
            }
            kendoGridInit.originalSelectable = kendoGridInit.selectable;

            if (attrs && attrs.ngBeforeEdit) {
              kendoGridInit.beforeEdit =  function(e) {scope.$eval(attrs.ngBeforeEdit);};
            }
            if (attrs && attrs.ngDataBinding) {
              kendoGridInit.dataBinding = function(e) {scope.$eval(attrs.ngDataBinding);};
            }
            if (attrs && attrs.ngSave) {
              kendoGridInit.save = function(e) {scope.$eval(attrs.ngSave);};
            }
            if (attrs && attrs.ngSaveChanges) {
              kendoGridInit.saveChanges = function(e) {scope.$eval(attrs.ngSaveChanges);};
            }
            if (attrs && attrs.ngRemove) {
              kendoGridInit.remove = function(e) {scope.$eval(attrs.ngRemove);};
            }

            return kendoGridInit;

          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var $templateDyn = $('<div></div>');
            var baseUrl = 'plugins/cronapp-lib-js/dist/js/kendo-ui/js/messages/kendo.messages.';
            if ($translate.use() == 'pt_br')
              baseUrl += "pt-BR.min.js";
            else
              baseUrl += "en-US.min.js";


            this.initCulture();
            var helperDirective = this;
            $.getScript(baseUrl, function () {

              var options = JSON.parse(attrs.options || "{}");

              var batchMode = options.batchMode == undefined || options.batchMode;
              if (batchMode && options.editable != 'datasource' && scope[options.dataSourceScreen.entityDataSource.name] && !scope[options.dataSourceScreen.entityDataSource.name].dependentLazyPost) {
                scope[options.dataSourceScreen.entityDataSource.name].batchPost = true;

                options.toolBarButtons = options.toolBarButtons || [];
                options.toolBarButtons.push({
                  type: "SaveOrCancelChanges",
                  title: $translate.instant('SaveChanges'),
                  methodCall: options.dataSourceScreen.entityDataSource.name + ".postBatchData()",
                  saveButton: true
                });
                options.toolBarButtons.push({
                  type: "SaveOrCancelChanges",
                  title: $translate.instant('CancelChanges'),
                  methodCall: options.dataSourceScreen.entityDataSource.name + ".cancelBatchData()",
                  saveButton: false
                });
              }

              var tooltips = helperDirective.getTooltipsDefault();
              var kendoGridInit = helperDirective.generateKendoGridInit(options, scope, ngModelCtrl, attrs, tooltips);

              var grid = $templateDyn.kendoGrid(kendoGridInit).data('kendoGrid');
              grid.dataSource.transport.options.grid = grid;
              options.grid = grid;

              helperDirective.setTooltips($templateDyn, tooltips);

              scope.safeApply(function() {
                if (scope[options.dataSourceScreen.entityDataSource.name]) {

                  $templateDyn.find('.k-filter-row').show();
                  $templateDyn.find('.k-pager-sizes').show();
                  $templateDyn.find('.k-pager-nav').show();
                  $templateDyn.find('.k-pager-numbers').show();
                  $templateDyn.find('.k-pager-refresh.k-link').show();
                  $templateDyn.find('.saveorcancelchanges').hide();

                  scope[options.dataSourceScreen.entityDataSource.name].addDataSourceEvents(
                      {
                        "pendingchanges": function(value) {
                          if (value) {
                            $templateDyn.find('.k-filter-row').hide();
                            $templateDyn.find('.k-pager-sizes').hide();
                            $templateDyn.find('.k-pager-nav').hide();
                            $templateDyn.find('.k-pager-numbers').hide();
                            $templateDyn.find('.k-pager-refresh.k-link').hide();
                            $templateDyn.find('.saveorcancelchanges').show();
                          } else {
                            $templateDyn.find('.k-filter-row').show();
                            $templateDyn.find('.k-pager-sizes').show();
                            $templateDyn.find('.k-pager-nav').show();
                            $templateDyn.find('.k-pager-numbers').show();
                            $templateDyn.find('.k-pager-refresh.k-link').show();
                            $templateDyn.find('.saveorcancelchanges').hide();
                          }
                        }
                      }
                  );

                  scope[options.dataSourceScreen.entityDataSource.name].addDataSourceEvents(
                      {
                        "afterchanges": function(value) {
                          //QAIBT-610
                          //grid.dataSource.filter([]);
                        }
                      }
                  );
                }
              });

            });

            element.html($templateDyn);
            $compile($templateDyn)(element.scope());

          }
        };
      }])

      .directive('cronSelect', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var select = {};
            try {
              select =  JSON.parse(attrs.options);
            } catch(err) {
              console.log('ComboBox invalid configuration! ' + err);
            }

            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var parent = element.parent();
            $(parent).append('<input style="width: 100%;" ' + id + name + ' class="cronSelect" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronSelect');

            var options = app.kendoHelper.getConfigCombobox(select, scope);
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.open = attrs.ngOpen ? function (){scope.$eval(attrs.ngOpen)}: undefined;
            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;
            options.change = function() {
              _scope.$apply(function () {
                _ngModelCtrl.$setViewValue(this.value());
              }.bind(combobox));
            }

            var combobox = $element.kendoComboBox(options).data('kendoComboBox');
            $(element).remove();

            var _scope = scope;
            var _ngModelCtrl = ngModelCtrl;

            var initializing = true;
            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = '';

                if ((typeof value === 'boolean') || (value)) {
                  result = value;
                }
                combobox.value(result);

                if (!initializing) {
                  if (attrs.ngChange) scope.$eval(attrs.ngChange);
                }
                initializing = false;
                combobox.value(result);
                return result;
              });
              ngModelCtrl.$parsers.push(function (value) {
                if ((typeof value === 'boolean') || value) {
                  return value;
                }
                return null;
              });
            }
          }
        };
      })

      .directive('cronDynamicSelect', function ($compile, $timeout, $parse) {
        return {
          restrict: 'E',
          replace: true,
          require: '?ngModel',
          goTo: function(scope, combobox, rowId) {
            dataSourceScreen = $(combobox).data('dataSourceScreen');
            if (dataSourceScreen != null) {
              return dataSourceScreen.goTo(rowId, true);
            }
          },
          compileAngular: function(scope, element) {
            var $template = $(element);
            var templateDyn = angular.element($template);
            $compile(templateDyn)(scope);
          },
          getActive: function(active) {
            if (active && active.indexOf('.active.')) {
              try {
                return eval(active.substr(0, active.indexOf('.active.')));
              } catch(e) {}
            }

            return null;
          },
          getFieldText: function(active, select) {
            if (active && active.indexOf('.active.') && select.dataTextField) {
              try {
                var text = active.substr(active.indexOf('.active.') + 8);
                return text + '_' + select.dataTextField;
              } catch(e) {}
            }

            return null;
          },
          isDefaultEntity: function(dataSource) {
            if (dataSource && dataSource.entity) {
              var parts = dataSource.entity.split('/');
              if (parts && parts.length > 0) {
                return parts.pop().indexOf('query') == -1;
              }
            }

            return false;
          },
          getModelParent: function (parametersExpression) {
            if (typeof parametersExpression === 'string' && parametersExpression.length > 9 && parametersExpression.indexOf('|raw}}') > 0) {
              parametersExpression = parametersExpression.trim();
              var model = parametersExpression.substr(parametersExpression.indexOf('{{') + 2);
              model = model.substr(0, model.indexOf('|raw}}'))
              return model.trim();
            } else {
              return null;
            }
          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var modelGetter = $parse(attrs['ngModel']);
            var modelSetter = modelGetter.assign;
            var select = {};
            var self = this;
            var parentDS = {};
            var textField = null;
            try {
              select = JSON.parse(attrs.options);
              parentDS = this.getActive(attrs.ngModel);
              textField = this.getFieldText(attrs.ngModel, select);
            } catch(err) {
              console.log('DynamicComboBox invalid configuration! ' + err);
            }

            //Rotina pra setar textField no model
            let lastFieldInModel = attrs['ngModel'].split('.');
            lastFieldInModel = lastFieldInModel[lastFieldInModel.length-1];
            let modelForTextField = attrs['ngModel'].replace(lastFieldInModel, textField);
            let modelTextFieldGetter = $parse(modelForTextField);
            let modelTextFieldSetter = modelTextFieldGetter.assign;

            /**
             * Configurações do componente
             */
            var options = app.kendoHelper.getConfigCombobox(select, scope);
            options.autoBind = false;
            var dataSourceScreen = null;
            try {
              delete options.dataSource.schema.model.id;
              dataSourceScreen = eval(select.dataSourceScreen.name);
              dataSourceScreen.rowsPerPage = dataSourceScreen.rowsPerPage ? dataSourceScreen.rowsPerPage : 100;
              options.dataSource.transport.origin = 'combobox';
            } catch(e){}

            options.virtual = {};
            options.virtual.itemHeight = 26;
            var _scope = scope;
            var _goTo = this.goTo;
            var _compileAngular = this.compileAngular;
            if (options.dataSource.pageSize && options.dataSource.pageSize > 0) {
              options.height = (options.dataSource.pageSize) * options.virtual.itemHeight / 4;
              options.virtual.mapValueTo = 'dataItem';
              var _options = options;
              /**
               * O método ValueMapper é utilizado para buscar um valor que não esteja em cache.
               */
              options.virtual.valueMapper = function(options) {
                var _combobox = _options.combobox;
                if (options.value || options.value === "") {
                  if(_combobox.options.optionLabel[_combobox.options.dataValueField] !== null && options.value === ""){
                    options.success(null);
                  }
                  else{
                    _combobox.isEvaluating = true;
                    var _dataSource = _options.dataSource.transport.options.cronappDatasource;
                    _dataSource.findObj([options.value], false, function(data) {
                      options.success(data);
                      _combobox.isEvaluating = false;

                      if (select.changeCursor) {
                        scope.safeApply(function() {
                          if (data != null) {
                            var found = _goTo(_scope, _combobox, data);
                            if (!found) {
                              _dataSource.data.push(data);
                              _goTo(_scope, _combobox, data);
                            }
                          } else {
                            modelSetter(_scope, null);
                          }
                        });
                      } else {
                        if (data == null) {
                          modelSetter(_scope, null);
                        }
                      }

                    }, function() {
                      options.success(null);
                      _combobox.isEvaluating = false;
                    });
                  }
                } else {
                  options.success(null);
                }
              };
            }

            options.change = attrs.ngChange ? function (){scope.$eval(attrs.ngChange)}: undefined;
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.open = function(e) {
              if (!dataSourceScreen.fetched) {
                combobox.options.firstLazyRead = true;
                combobox.dataSource.read();
              }

              if (attrs.ngOpen) { scope.$eval(attrs.ngOpen)(e); };
            }

            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;

            /**
             * Renderizando DropdownList
             */
            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var inputSelect = $('<input style="width: 100%;"' + id + name + ' class="cronDynamicSelect" ng-model="' + attrs.ngModel + '"/>');

            //https://stackoverflow.com/questions/21948067/issues-with-ng-required-directive-angular-js
            attrs.$observe('required', function(value) {
              inputSelect.prop('required', value);
            });
            $(parent).append(inputSelect);
            var $element = $(parent).find('input.cronDynamicSelect');
            var combobox = $element.kendoDropDownList(options).data('kendoDropDownList');
            options.combobox = combobox;
            if (dataSourceScreen != null && dataSourceScreen != undefined) {
              $(combobox).data('dataSourceScreen', dataSourceScreen);
            }
            if (attrs.ngRequired || attrs.required) {
              $(combobox.element[0]).attr('style','');
              $(combobox.element[0]).attr('class','cron-select-offscreen');
            }

            var forceChangeModel = function(value) {
              if (combobox.isEvaluating) {
                setTimeout(function() {
                  forceChangeModel(value);
                }, 100);
                return;
              }

              if (value === undefined) {
                value = null;
              }

              combobox.value(value);

              if (select.changeCursor) {
                if (!combobox.isEvaluating) {
                  if (value == null || value == undefined) {
                    dataSourceScreen.active = {};
                    dataSourceScreen.cursor = -1;
                  } else {
                    var found = _goTo(_scope, combobox, combobox.dataItem());

                    if (!found) {
                      dataItem = objectClone(combobox.dataItem(), combobox.dataSource.options.schema.model.fields);
                      dataSourceScreen.data.push(dataItem);
                      _goTo(_scope, combobox, dataItem);
                    }
                  }
                }

              }
            }

            /**
             * Observa o read do datasource para setar o primeiro valor ou valor inicial.
             */

            var defineInitialValue = function() {
              if (!combobox.isEvaluating) {
                var currentValue = combobox.value();
                var nextValue = null;

                var found = dataSourceScreen.goTo(currentValue);

                if (!found) {
                  if ((combobox.options.lazyFirstInitialValue || !dataSourceScreen.lazy) && select.initValue != undefined && select.initValue != null) {
                    combobox.options.lazyFirstInitialValue = false;
                    found = dataSourceScreen.goTo(select.initValue);
                    if (found) {
                      nextValue = select.initValue;
                    }
                  }


                  if (nextValue == null && select.firstValue) {
                    if (dataSourceScreen && dataSourceScreen.data.length) {
                      nextValue = dataSourceScreen.data[0][select.dataValueField];
                    }
                  }

                  modelSetter(_scope, nextValue);
                  forceChangeModel(nextValue);
                }
              }
              else {
                setTimeout(()=>defineInitialValue(),300);
              }
            }

            var _ngModelCtrl = ngModelCtrl;
            if (dataSourceScreen != null && dataSourceScreen != undefined) {
              dataSourceScreen.addDataSourceEvents({
                refresh: function() {
                  defineInitialValue();
                },
                read: function(data) {

                  var fromCombo = combobox.options.fromCombo;
                  combobox.options.fromCombo = false;
                  if (!fromCombo) {
                    combobox.options.readData = data;
                    this.dataSource.read();


                    if (combobox.options.lazyFirstValue) {
                      combobox.options.lazyFirstValue = false;
                      defineInitialValue();
                    }
                  }
                }.bind(combobox)
              });
            }

            /**
             * Observando se houve mudança no valor do DropdownList.
             */
            var _isDefaultEntity = this.isDefaultEntity;
            $element.on('change', function (event) {
              _scope.$apply(function () {
                modelSetter(_scope, combobox.dataItem()[select.dataValueField]);
                modelTextFieldSetter(_scope, combobox.dataItem()[select.dataTextField]);
                if(select.changeValueBasedOnLabel){
                  let comboLabelValue = combobox.dataItem()[select.dataTextField];
                  // Try to eval it first in pure vanilla and then if it was not possible in angular context.
                  try {
                    eval(select.changeValueBasedOnLabel + '=' + '"' + comboLabelValue + '"');
                  }catch (e) {
                    try {
                      _scope.$eval(select.changeValueBasedOnLabel + '=' + '"' + comboLabelValue + '"')
                    }catch (e) {
                      console.error("Não foi possível atribuir o texto do combobox ", comboLabelValue, " no compo informado ", select.changeValueBasedOnLabel);
                    }
                  }
                }
              });

              _compileAngular(scope, options.combobox.element[0]);
            });

            /**
             * Observando model do DropdownList.
             */
            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var x = combobox.value();
                if (value === undefined)
                  value = null;
                return forceChangeModel(value);
              });

              ngModelCtrl.$parsers.push(function (value) {
                if ((typeof value === 'boolean') || value) {
                  if (combobox.options.valuePrimitive === true) {
                    if (typeof value == 'string') {
                      return value;
                    } else if ((typeof value[select.dataValueField] === 'boolean') || value[select.dataValueField]) {
                      return value[select.dataValueField];
                    }
                  } else {
                    try {
                      return objectClone(value, combobox.dataSource.options.schema.model.fields);
                    } catch(e){}
                  }
                }
                return null;
              });
            }

            if (select.initValue) {
              if (select.initValue.startsWith('params.')) {
                var type = combobox.dataSource.options.schema.model.fields[select.dataValueField].type;
                select.initValue = scope.$eval(select.initValue);
                if (type != 'string') {
                  select.initValue = dataSourceScreen.normalizeValue(select.initValue, true);
                }
              } else {
                select.initValue = scope.$eval(select.initValue);
              }

            } else {
              select.initValue = null;
            }

            if (select.initValue == '') {
              select.initValue = null;
            }

            if (combobox.dataSource.transport && combobox.dataSource.transport.options) {
              combobox.dataSource.transport.options.combobox = combobox;
              combobox.dataSource.transport.options.$compile = $compile;
              combobox.dataSource.transport.options.scope = scope;
              combobox.dataSource.transport.options.ngModelCtrl = ngModelCtrl;
              combobox.dataSource.transport.options.initRead = true;

              if (select.initValue != undefined && select.initValue != null) {
                modelSetter(_scope, select.initValue);
                combobox.options.lazyFirstInitialValue = true;
              }
              else if (select.firstValue) {
                combobox.options.lazyFirstValue = true;

                if (dataSourceScreen.lazy && !dataSourceScreen.fetched) {
                  dataSourceScreen.fetch({});
                }
              }

            }

            $(combobox.span).on('DOMSubtreeModified', function(e){
              _compileAngular(scope, e.target);
            });

            $(combobox.ul).on('DOMSubtreeModified', function(e){
              $timeout(function() {
                _compileAngular(scope, e.target);
              });
            });

            _compileAngular(scope, combobox.span);
            _compileAngular(scope, combobox.ul);

            $(element).remove();
          }
        };
      })

      .directive('cronMultiSelect', function ($compile, $parse) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var modelGetter = $parse(attrs['ngModel']);
            var modelSetter = modelGetter.assign;
            var model = attrs['ngModel'];

            var _self = this;
            var select = {};
            try {
              select = JSON.parse(attrs.options);
            } catch(err) {
              console.log('MultiSelect invalid configuration! ' + err);
            }

            var _scope = scope;
            var _ngModelCtrl = ngModelCtrl;

            var relactionDS = {
              relationDataSource: (select.relationDataSource != null ? eval(select.relationDataSource.name) : null),
              relationField: (select.relationField != null ? select.relationField : '')
            }

            var options = app.kendoHelper.getConfigCombobox(select, scope);

            try {
              delete options.dataSource.schema.model.id;
            } catch(e){}

            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            $(parent).append('<input style="width: 100%;"' + id + name + ' class="cronMultiSelect" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronMultiSelect');
            $(element).remove();

            var evtSelect;
            var deselect;

            options['deselect'] = function(e) {
              var dataItem = e.dataItem;
              var relation = this.relationDataSource;
              var dataValueField = e.sender.options.dataValueField;

              var selectItem = null;
              if (relation && relation.data && dataItem[dataValueField]) {
                for (key in relation.data) {
                  var item = relation.data[key];
                  if (item[this.relationField] && (item[this.relationField] == dataItem[dataValueField])) {
                    selectItem = item;
                    break;
                  }
                };

                if (selectItem != null) {
                  $(combobox).data('silent', true);
                  this.relationDataSource.removeSilent(selectItem, null, null);
                }
              } else {
                if (model) {
                  _scope.$apply(function () {
                    try {
                      var data = eval('_scope.' + model);
                      data = data.filter(it => it[dataValueField] !== dataItem[dataValueField]);
                      $(combobox).data('silent', true);
                      modelSetter(_scope, data);
                    } catch (e) {}
                  });
                }
              }

              if (deselect) {
                deselect();
              }

            }.bind(relactionDS);

            options['select'] = function(e) {
              var dataItem = e.dataItem;
              var dataValueField = e.sender.options.dataValueField;
              var combobox = e.sender;

              if (this.relationDataSource && dataItem[dataValueField]) {
                var obj = {};
                obj[this.relationField] = dataItem[dataValueField];
                $(combobox).data('silent', true);
                this.relationDataSource.startInserting(obj, function(data){
                  this.postSilent();
                }.bind(this.relationDataSource));
              } else {
                if (model) {
                  _scope.$apply(function () {
                    try {
                      var data = eval('_scope.' + model);
                      if (!data) {
                        data = [];
                      }
                      data.push(objectClone(dataItem, combobox.dataSource.options.schema.model.fields));
                      $(combobox).data('silent', true);
                      modelSetter(_scope, data);
                    } catch(e) {}
                  });
                }
              }

              if (evtSelect) {
                evtSelect();
              }

            }.bind(relactionDS);

            options['change'] = attrs.onChange ? function (){eval(attrs.onChange)}: undefined;
            options['close'] = attrs.onClose ? function (){eval(attrs.onClose)}: undefined;
            options['dataBound'] = attrs.onDatabound ? function (){eval(attrs.onDatabound)}: undefined;
            options['filtering'] = attrs.onFiltering ? function (){eval(attrs.onFiltering)}: undefined;
            options['open'] = attrs.onOpen ? function (){eval(attrs.onOpen)}: undefined;
            options['cascade'] = attrs.onCascade ? function (){eval(attrs.onCascade)}: undefined;
            evtSelect = attrs.onSelect ? function (){eval(attrs.onSelect)}: undefined;
            deselect = attrs.onDeselect ? function (){eval(attrs.onDeselect)}: undefined;

            var combobox = $element.kendoMultiSelect(options).data('kendoMultiSelect');

            var convertArray = function(value) {
              var result = [];
              if (value) {
                for (var item in value) {
                  result.push(value[item][relactionDS.relationField]);
                }
              }
              return result;
            }

            scope.$watchCollection(function(){return ngModelCtrl.$modelValue}, function(value, old){
              var silent = $(combobox).data('silent');
              $(combobox).data('silent', false);
              if (!silent && (JSON.stringify(value) !== JSON.stringify(old))) {
                if (relactionDS.relationDataSource && relactionDS.relationField) {
                  combobox.value(convertArray(value));
                } else {
                  combobox.value(value);
                }
              }
            });
          }
        };
      })

      .directive('cronAutoComplete', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var select = {};
            try {
              select = JSON.parse(attrs.options);
            } catch(err) {
              console.log('AutoComplete invalid configuration! ' + err);
            }

            try {
              delete options.dataSource.schema.model.id;
            } catch(e){}

            var options = app.kendoHelper.getConfigCombobox(select, scope);
            options.change = attrs.ngChange ? function (){scope.$eval(attrs.ngChange)}: undefined;
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.open = attrs.ngOpen ? function (){scope.$eval(attrs.ngOpen)}: undefined;
            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;
            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var required = '';
            if (attrs.ngRequired || attrs.required) {
              required = ' required ';
            }
            $(parent).append('<input style="width: 100%;" ' + id + name + required + ' class="cronAutoComplete" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronAutoComplete');
            $(element).remove();

            options['change'] = function(e) {
              scope.$apply(function () {
                ngModelCtrl.$setViewValue($element.val());
              });
            }

            var autoComplete = $element.kendoAutoComplete(options).data('kendoAutoComplete');

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                autoComplete.value(value);
                return value;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value) {
                  if (typeof value == 'string') {
                    return value;
                  } else if (value[select.dataTextField]) {
                    return value[select.dataTextField];
                  }
                }

                return null;
              });
            }
          }
        }
      })

      .directive('cronDate', ['$compile', '$translate', '$window', function ($compile, $translate, $window) {
        return {
          restrict: 'AE',
          require: '?ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var options = {};
            var cronDate = {};

            try {
              if (attrs.options)
                cronDate =  JSON.parse(attrs.options);
              else {
                var json = window.buildElementOptions(element);
                cronDate = JSON.parse(json);
              }
              if (!cronDate.format) {
                cronDate.format = parseMaskType(cronDate.type, $translate)
              }
              options = app.kendoHelper.getConfigDate($translate, cronDate);
            } catch(err) {
              console.log('AutoComplete invalid configuration! ' + err);
            }

            var useUTC = options.type == 'date' || options.type == 'datetime' || options.type == 'time';

            if (!window.fixedTimeZone) {
              useUTC = false;
            }

            var $element = $(element);
            if ($element.data('alreadycompiled'))
              return;
            $element.data('alreadycompiled',true);

            if (attrs.fromGrid) {
              $element = $(element);
            }
            else {
              var parent = element.parent();
              var $input = $('<input style="width: 100%;" class="cronDate" ng-model="' + attrs.ngModel + '"/>');
              $(parent).append($input);
              $element = $(parent).find('input.cronDate');
              $element.data("type", options.type);
              $element.attr("type", "date");
            }

            var datePicker = app.kendoHelper.buildKendoMomentPicker($element, options, scope, ngModelCtrl);

            if (attrs.fromGrid) {
              var initialDate = $element.data('initial-date');
              var unmaskedvalue = function() {
                var momentDate = null;

                var valueDate =  $(this).val();
                if (initialDate) {
                  valueDate = initialDate;
                  initialDate = undefined;
                }

                if (useUTC) {
                  momentDate = moment(valueDate, options.momentFormat).utcOffset(window.timeZoneOffset);
                } else {
                  momentDate = moment(valueDate, options.momentFormat);
                }

                datePicker.value(momentDate.format(options.momentFormat));
                $(this).data('rawvalue', momentDate.toDate());
              }
              $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue).on('change', unmaskedvalue);
              unmaskedvalue.bind($element)();
            }
            else {
              if (ngModelCtrl) {
                ngModelCtrl.$formatters.push(function (value) {
                  var selDate = null;

                  if (value) {
                    var momentDate = null;

                    if (useUTC) {
                      momentDate = moment(value).utcOffset(window.timeZoneOffset);;
                    } else {
                      momentDate = moment(value);
                    }

                    selDate = momentDate.format(options.momentFormat);
                  }

                  datePicker.value(selDate);

                  return selDate;
                });

                ngModelCtrl.$parsers.push(function (value) {
                  if (value) {
                    var momentDate = null;
                    if (useUTC) {
                      momentDate = moment(datePicker._oldText, options.momentFormat).utcOffset(window.timeZoneOffset);;
                    } else {
                      momentDate = moment(datePicker._oldText, options.momentFormat);
                    }
                    return momentDate.toDate();
                  }

                  return null;
                });
              }

              $(element).remove();
            }
          }
        }
      }])

      .directive('cronSlider', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          getActive: function(active, scope) {
            if (active && active.indexOf('.active.')) {
              try {
                return scope.$eval(active.substr(0, active.indexOf('.active.')));
              } catch(e) {}
            }

            return undefined;
          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var slider = {};

            try {
              slider = JSON.parse(attrs.options);
            } catch(err) {
              console.log('Slider invalid configuration! ' + err);
            }

            var config = app.kendoHelper.getConfigSlider(slider);
            var dataSource = this.getActive(attrs.ngModel, scope);
            config.change = function (){
              scope.$apply(function () {
                var value = $(element).val();
                if (dataSource) {
                  value = dataSource.normalizeValue(value, true)
                }
                ngModelCtrl.$setViewValue(value);
                if (attrs.ngChange) {
                  scope.$eval(attrs.ngChange);
                }
              });
            }

            config.slide = attrs.ngSlide ? function (){scope.$eval(attrs.ngSlide)}: undefined;
            var slider = $(element).kendoSlider(config).data("kendoSlider");

            if (attrs.ngRequired || attrs.required) {
              var id = attrs.id ? ' id="input' + app.common.generateId() + '"' : '';
              var name = attrs.name ? ' name="input' + app.common.generateId() + '"' : '';
              var parent = element.parent();
              $(parent).append('<input autocomplete="off" tabindex="-1" style="width: 100%;"' + id + name + ' required class="cronSlider cron-select-offscreen" ng-model="' + attrs.ngModel + '"/>');
              var input = $(parent).find("input.cronSlider");
              $compile(input)(element.scope());
            }

            scope.$watch(function(){return ngModelCtrl.$modelValue}, function(value, old){
              if (value !== old) {
                if (!value) {
                  slider.value(slider.min());
                } else {
                  slider.value(value);
                }
              }
            });

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = null;

                if (!value && slider.min) {
                  result = slider.min;
                } else if (value) {
                  result = value;
                }

                slider.value(result);

                return result;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value) {
                  return value;
                }

                return null;
              });
            }
          }
        }
      })

      .directive('cronSwitch', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var cronSwitch = {};

            try {
              var json = window.buildElementOptions(element);
              cronSwitch = JSON.parse(json);
            } catch(err) {
              console.log('Switch invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigSwitch(cronSwitch);
            var parent = element.parent();
            $(parent).append('<input style="width: 100%;" class="cronSwitch" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronSwitch');

            var change = function(e) {
              scope.$apply(function () {
                ngModelCtrl.$setViewValue(this.value());
              }.bind(this));
            }
            options['change'] = change;

            var mobSwitch = $element.kendoMobileSwitch(options).data('kendoMobileSwitch');
            $(element).remove();

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = false;

                if (value != undefined) {
                  result = value;
                }

                mobSwitch.value(result);

                return result;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value != undefined) {
                  return value;
                }

                return false;
              });
            }
          }
        }
      })

      .directive('cronBarcode', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModel) {
            var cronBarcode = {};

            try {
              var json = window.buildElementOptions(element);
              cronBarcode = JSON.parse(json);
            } catch(err) {
              console.log('Barcode invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigBarcode(cronBarcode);
            var parent = element.parent();
            $(parent).append('<span class="cronBarcode" ng-model="' + attrs.ngModel + '"></span>');
            var $element = $(parent).find('span.cronBarcode');

            var kendoBarcode = $element.kendoBarcode(options).data('kendoBarcode');
            $(element).remove();

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              var result = '';

              if (value !== old) {
                result = value;
              }

              options['value'] = result;
              kendoBarcode.setOptions(options);
            });
          }
        }
      })

      .directive('cronQrcode', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModel) {
            var cronQrcode = {};

            try {
              var json = window.buildElementOptions(element);
              cronQrcode = JSON.parse(json);
            } catch(err) {
              console.log('Qrcode invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigQrcode(cronQrcode);
            var parent = element.parent();
            $(parent).append('<span class="cronQrcode" ng-model="' + attrs.ngModel + '"></span>');
            var $element = $(parent).find('span.cronQrcode');

            var kendoQRCode = $element.kendoQRCode().data('kendoQRCode');
            $(element).remove();

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              var result = '';

              if (value !== old) {
                result = value;
              }

              options['value'] = result;
              kendoQRCode.setOptions(options);
            });
          }
        }
      })

      .directive('cronappRating', function() {
        'use strict';
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function(scope, elem, attrs, ngModelCtrl) {

            attrs.theme = $(elem).find('i').attr('xattr-theme');
            attrs.iconOn = $(elem).find('i').attr('class');

            var $elem = $(elem);
            var starArray = [];

            if (attrs.xattrDefaultValue) {
              ngModelCtrl.$viewValue = 0; //set new view value
              ngModelCtrl.$commitViewValue();
            }

            for (var i=1;i<=5;i++) {
              starArray.push($(elem).find('i').get(i - 1));
              $(starArray[i-1]).addClass(attrs.iconOff || "fa fa-star-o");
            }

            $elem.html("");
            var stars = [];

            for (var i=1;i<=5;i++) {
              var clonned = $(starArray[i-1]).clone();
              $elem.append(clonned);

              clonned.attr("idx", i);
              clonned.click(function() {
                scope.$apply(function() {
                  ngModelCtrl.$viewValue = parseInt($(this).attr("idx")); //set new view value
                  ngModelCtrl.$commitViewValue();

                }.bind(this));
              });

              stars.push(clonned);
            }

            function changeStars(value) {
              for (var i=1;i<=5;i++) {
                stars[i-1].removeClass(attrs.iconOff || 'fa fa-star-o');
                stars[i-1].removeClass(attrs.iconOn);
                stars[i-1].removeClass(attrs.theme);
                if (i <= value) {
                  stars[i-1].addClass(attrs.iconOn);
                  stars[i-1].addClass(attrs.theme);
                } else {
                  stars[i-1].addClass(attrs.iconOff || 'fa fa-star-o');
                  stars[i-1].addClass(attrs.theme);
                }
              }
              return value;
            }
            ngModelCtrl.$parsers.push(changeStars);
            ngModelCtrl.$formatters.push(changeStars);

          }
        }
      })

      .directive('cronDynamicMenu', ['$compile', '$translate', function($compile, $translate){
        'use strict';

        return {
          restrict: 'EA',
          populateItems: function(items) {
            var template = '';

            if (items && items != null && Array.isArray(items)) {
              items.forEach(function(item) {
                var security = (item.security && item.security != null) ? ' cronapp-security="' + item.security + '" ' : '';
                var action = (item.action && item.action != null) ? ' ng-click="' + item.action + '" ' : '';
                var hide = (item.hide && item.hide != null) ? ' ng-hide="' + item.hide + '" ' : '';
                var iconClass = (item.iconClass && item.iconClass != null) ? '<i class="'+ item.iconClass +'"></i>' : '';
                var title = '<span></span>';
                if (item.title)
                  title = '<span>' + $translate.instant(item.title) + '</span>';

                template = template + '<li'+ hide +'><a href=""' + security + action + '>' + iconClass + title + '</a></li>';
              });

              if (template != '') {
                template = '<ul class="dropdown-menu">' + template + '</ul>';
              }
            }

            return template;
          },
          populateMenu: function(menuOptions) {
            var template = '';

            if (menuOptions && menuOptions!= null && menuOptions.subMenuOptions && menuOptions.subMenuOptions != null && Array.isArray(menuOptions.subMenuOptions)){
              var _populateItems = this.populateItems;
              menuOptions.subMenuOptions.forEach(function(menu) {
                var security = (menu.security && menu.security != null) ? ' cronapp-security="' + menu.security + '" ' : '';
                var action = (menu.action && menu.action != null) ? ' ng-click="' + menu.action + '" ' : '';
                var caret = (menu.menuItems && Array.isArray(menu.menuItems) && (menu.menuItems.length > 0)) ? '<span class="caret"></span>' : '';
                var hide = (menu.hide && menu.hide != null) ? ' ng-hide="' + menu.hide + '" ' : '';
                var iconClass = (menu.iconClass && menu.iconClass != null) ? '<i class="'+ menu.iconClass +'"></i>' : '';
                var title = '<span></span>'
                if (menu.title)
                  title = '<span>' + $translate.instant(menu.title) + '</span>';

                template = template  + '\
              <li class="dropdown component-holder crn-menu-item" data-component="crn-menu-item"' + security + hide + '>\
                <a href="" ' + action + ' class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\
                ' + iconClass + title + caret + _populateItems(menu.menuItems) + '\
                </a> \
              </li>';
              })
            }

            return template;
          },
          link: function(scope, element, attrs) {
            $translate.onReady(() => {
              var TEMPLATE_MAIN = '<ul class="nav navbar-nav" style="float:none"></ul>';
            var options = {};
            try {
              options = JSON.parse(attrs.options);
            } catch(e) {
              console.log('CronDynamicMenu: Invalid configuration!')
            }

            var main = $(TEMPLATE_MAIN);
            var menus = this.populateMenu(options);
            main.append(menus);

            var newElement = angular.element(main);
            element.html('');
            element.append(main);
            element.attr('id' , null);
            $compile(newElement)(scope);

          });
          }
        }
      }])

      .directive('ngInitialValue', function($parse) {
        return {
          restrict: 'A',
          require: 'ngModel',
          link: function(scope, element, attrs, ngModelCtrl) {
            if (attrs.ngInitialValue) {
              var modelGetter = $parse(attrs['ngModel']);
              var modelSetter = modelGetter.assign;
              var evaluated;

              try {
                evaluated = scope.$eval(attrs.ngInitialValue);
              } catch (e) {
                evaluated = attrs.ngInitialValue;
              }

              // verifica se é um checkbox para transformar para um valor booleano
              if (element[0].type == 'checkbox' && evaluated) {
                evaluated = ('' + evaluated).toLowerCase() == 'true';
              }

              modelSetter(scope, evaluated);
            }
          }
        }
      })

      .directive('crnSetIndeterminate', function($parse) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            let value = eval(attrs.crnSetIndeterminate);
            if(value === null){
              $(element).prop("indeterminate", true);
            }
          }
        }
      })

      .directive('crnAllowNullValues', [function () {
        return {
          restrict: 'A',
          require: '?ngModel',
          link: function (scope, el, attrs, ctrl) {
            ctrl.$formatters = [];
            ctrl.$parsers = [];
            if (attrs.crnAllowNullValues == 'true') {
              ctrl.$render = function () {
                var viewValue = ctrl.$viewValue;
                el.data('checked', viewValue);
                switch (viewValue) {
                  case true:
                    el.prop('indeterminate', false);
                    el.prop('checked', true);
                    break;
                  case false:
                    el.prop('indeterminate', false);
                    el.prop('checked', false);
                    break;
                  default:
                    el.prop('indeterminate', true);
                }
              };
              el.bind('click', function () {
                var checked;
                switch (el.data('checked')) {
                  case false:
                    checked = true;
                    break;
                  case true:
                    checked = null;
                    break;
                  default:
                    checked = false;
                }
                ctrl.$setViewValue(checked);
                scope.$apply(ctrl.$render);
              });
            } else if (attrs.crnAllowNullValues == 'false'){
              ctrl.$render = function () {
                var viewValue = ctrl.$viewValue;
                if(viewValue === undefined || viewValue === null){
                  ctrl.$setViewValue(false);
                  viewValue = false;
                }
                el.data('checked', viewValue);
                switch (viewValue) {
                  case true:
                    el.prop('indeterminate', false);
                    el.prop('checked', true);
                    break;
                  default:
                    el.prop('indeterminate', false);
                    el.prop('checked', false);
                    break;
                }
              };
              el.bind('click', function () {
                var checked;
                switch (el.data('checked')) {
                  case false:
                    checked = true;
                    break;
                  default:
                    checked = false;
                }
                ctrl.$setViewValue(checked);
                scope.$apply(ctrl.$render);
              });
            }
          }
        };
      }])

      .directive('cronChat',  ['$compile', '$translate', function($compile, $translate) {
        return {
          restrict: 'E',
          replace: true,
          link: function (scope, element, attrs, ngModelCtrl) {

            var options = JSON.parse(attrs.options || "{}");
            if (options.token && options.urlCronchat) {

              var urlChat = options.urlCronchat.endsWith("/") ? options.urlCronchat : options.urlCronchat + '/';
              var token = options.token;

              var $templateDyn = $(`<script src="${urlChat}get-chat?token=${token}" type="text/javascript"></script>`);
              element.html($templateDyn);
            }

          }
        };
      }])
}(app));

function maskDirectiveAsDate($compile, $translate, $parse) {
  return maskDirective($compile, $translate, $parse, 'as-date');
}

function maskDirectiveMask($compile, $translate, $parse) {
  return maskDirective($compile, $translate, $parse, 'mask');
}

function maskDirective($compile, $translate, $parse, attrName) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      if(attrName == 'as-date' && attrs.mask !== undefined)
        return;

      var modelGetter = $parse(attrs['ngModel']);

      var modelSetter = modelGetter.assign;


      var $element = $(element);
      if ($element.data('alreadycompiled'))
        return;
      $element.data('alreadycompiled', true);

      var type = $element.attr("type");

      if (type == "checkbox" || type == "password")
        return;

      $element.data("type", type);

      $element.attr("type", "text");

      if (ngModelCtrl) {
        ngModelCtrl.$formatters = [];
        ngModelCtrl.$parsers = [];
      }

      if (attrs.asDate !== undefined && type == 'text')
        type = "date";

      var textMask = true;

      var removeMask = false;

      var attrMask = attrs.mask || attrs.format;

      if (!attrMask) {
        attrMask = parseMaskType(type, $translate);
      } else {
        attrMask = parseMaskType(attrMask, $translate);
      }

      if (attrMask.endsWith(";0")) {
        removeMask = true;
      }

      var mask = attrMask.replace(';1', '').replace(';0', '').trim();
      if (mask == undefined || mask.length == 0) {
        return;
      }

      if (type == 'date' || type == 'datetime' || type == 'datetime-local' || type == 'month' || type == 'time' || type == 'time-local' || type == 'week') {

        var options = {
          format: mask,
          locale: $translate.use(),
          showTodayButton: true,
          useStrict: true,
          tooltips: {
            today: $translate.instant('DatePicker.today'),
            clear: $translate.instant('DatePicker.clear'),
            close: $translate.instant('DatePicker.close'),
            selectMonth: $translate.instant('DatePicker.selectMonth'),
            prevMonth: $translate.instant('DatePicker.prevMonth'),
            nextMonth: $translate.instant('DatePicker.nextMonth'),
            selectYear: $translate.instant('DatePicker.selectYear'),
            prevYear: $translate.instant('DatePicker.prevYear'),
            nextYear: $translate.instant('DatePicker.nextYear'),
            selectDecade: $translate.instant('DatePicker.selectDecade'),
            prevDecade: $translate.instant('DatePicker.prevDecade'),
            nextDecade: $translate.instant('DatePicker.nextDecade'),
            prevCentury: $translate.instant('DatePicker.prevCentury'),
            nextCentury: $translate.instant('DatePicker.nextCentury')
          }
        };

        if (mask != 'DD/MM/YYYY' && mask != 'MM/DD/YYYY') {
          options.sideBySide = true;
        }

        var useUTC = type == 'date' || type == 'datetime' || type == 'time';

        if (!window.fixedTimeZone) {
          useUTC = false;
        }

        if ($element.attr('from-grid')) {
          var openPopup = function() {
            var popup = $(this).offset();
            var isBellowInput = true;
            var datetimepickerShowing = $(this).parent().find('.bootstrap-datetimepicker-widget.dropdown-menu.usetwentyfour.bottom');
            if (!datetimepickerShowing.length) {
              isBellowInput = false;
              datetimepickerShowing = $(this).parent().find('.bootstrap-datetimepicker-widget.dropdown-menu.usetwentyfour.top');
            }
            if ($(datetimepickerShowing).offset()) {
              var popupLeft = $(datetimepickerShowing).offset().left;

              var grid = $('body');
              datetimepickerShowing.appendTo(grid);

              var popupTop = 0
              if (!isBellowInput)
                popupTop = popup.top - ($(datetimepickerShowing).height() + 15);
              else
                popupTop = popup.top + 35;

              datetimepickerShowing.css("top", popupTop);
              datetimepickerShowing.css("bottom", "auto");
              datetimepickerShowing.css("left", popupLeft);
              datetimepickerShowing.css("z-index", 999999);
            }
          };
          $element.on('click', openPopup);
          $element.on('focus', function() {
            setTimeout(openPopup.bind(this), 100);
          });
          $element.on('dp.change', function () {
            var momentDate = null;
            if (useUTC) {
              momentDate = moment($element.val(), mask).utcOffset(window.timeZoneOffset);
            } else {
              momentDate = moment($element.val(), mask);
            }
            if (type == 'time' || type == 'time-local') {
              momentDate = momentDate.year(1970).dayOfYear(1).month(0);
            }
            $element.data('rawvalue', momentDate.toDate());
          });
          if ($element.data('initial-value')) {
            var initialValue = $element.data('initial-value');
            var momentDate = null;
            if (useUTC) {
              momentDate = moment(initialValue).utcOffset(window.timeZoneOffset);
            } else {
              momentDate = moment(initialValue);
            }
            $element.val(momentDate.format(mask));
            $element.data('initial-value', null);
          }

        }
        else {
          $element.wrap("<div style=\"position:relative\"></div>");
        }
        $element.datetimepicker(options);

        $element.on('dp.change', function () {
          if ($(this).is(":visible")) {
            $(this).trigger('change');
            scope.safeApply(function () {
              var value = $element.val();
              var momentDate = null;
              if (useUTC) {
                momentDate = moment(value, mask).utcOffset(window.timeZoneOffset, true);
              } else {
                momentDate = moment(value, mask);
              }
              if (type == 'time' || type == 'time-local') {
                momentDate = momentDate.year(1970).dayOfYear(1).month(0);
              }
              if (momentDate.isValid() && ngModelCtrl) {
                modelSetter(scope, momentDate.toDate());
              }
            });
          }
        });

        if (ngModelCtrl) {
          ngModelCtrl.$formatters.push(function (value) {
            if (value) {
              var momentDate = null;

              if (useUTC) {
                momentDate = moment(value).utcOffset(window.timeZoneOffset);
                if(!momentDate.isValid()){
                  momentDate = moment(value, mask).utcOffset(window.timeZoneOffset);
                }
              } else {
                momentDate = moment(value);
                if(!momentDate.isValid()){
                  momentDate = moment(value, mask);
                }
              }

              return momentDate.format(mask);
            }

            if(value === null){
              var dp = $element.datetimepicker(options).data('DateTimePicker');
              dp.date(null);
            }

            return null;
          });

          ngModelCtrl.$parsers.push(function (value) {
            if (value) {
              if (value instanceof Date) {
                return value;
              }
              var momentDate = null;
              if (useUTC) {
                momentDate = moment(value, mask).utcOffset(window.timeZoneOffset);
              } else {
                momentDate = moment(value, mask);
              }
              if (type == 'time' || type == 'time-local') {
                momentDate = momentDate.year(1970).dayOfYear(1).month(0);
              }
              return momentDate.toDate();
            }

            return null;
          });
        }

      } else if (type == 'number' || type == 'money' || type == 'integer' || type == 'money-decimal') {
        removeMask = true;

        var currency = mask.trim().replace(/\./g, '').replace(/\,/g, '').replace(/#/g, '').replace(/0/g, '').replace(/9/g, '');

        var prefix = '';
        var suffix = '';
        var thousands = '';
        var decimal = ',';
        var precision = 0;

        if (mask.startsWith(currency)) {
          prefix = currency;
        }
        else if (mask.endsWith(currency)) {
          suffix = currency;
        }

        var pureMask = mask.trim().replace(prefix, '').replace(suffix, '').trim();

        if (pureMask.startsWith("#.")) {
          thousands = '.';
        }
        else if (pureMask.startsWith("#,")) {
          thousands = ',';
        }

        var dMask = null;

        if (pureMask.indexOf(",0") != -1) {
          decimal = ',';
          dMask = ",0";
        }
        else if (pureMask.indexOf(".0") != -1) {
          decimal = '.';
          dMask = ".0";
        }

        if (dMask != null) {
          var strD = pureMask.substring(pureMask.indexOf(dMask) + 1);
          precision = strD.length;
        }

        var inputmaskType = 'numeric';

        if (precision == 0)
          inputmaskType = 'integer';

        if(type == 'money-decimal'){
          inputmaskType = 'currency';
        }

        var ipOptions = {
          'rightAlign':  (type == 'money' || type == 'money-decimal'),
          'unmaskAsNumber': true,
          'allowMinus': true,
          'prefix': prefix,
          'suffix': suffix,
          'radixPoint': decimal,
          'digits': precision,
          'numericInput' :  (type == 'money-decimal')
        };

        if (thousands) {
          ipOptions['autoGroup'] = true;
          ipOptions['groupSeparator'] = thousands;
        }

        $(element).inputmask(inputmaskType, ipOptions);

        var unmaskedvalue = function() {
          $(this).data('rawvalue',$(this).inputmask('unmaskedvalue'));
        }
        $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue);

        if (ngModelCtrl) {
          ngModelCtrl.$formatters.push(function (value) {
            if (value != undefined && value != null && value !== '') {
              return format(mask, value);
            }

            return null;
          });

          ngModelCtrl.$parsers.push(function (value) {
            if (value != undefined && value != null && value !== '') {
              var unmaskedvalue = $element.inputmask('unmaskedvalue');
              if (unmaskedvalue !== '')
                return unmaskedvalue;
            }

            return null;
          });
        }

      }

      else if (type == 'text' || type == 'tel') {

        var options = {};
        if (attrs.maskPlaceholder) {
          options.placeholder = attrs.maskPlaceholder
        }

        $element.mask(mask, options);

        var unmaskedvalue = function() {
          if (removeMask)
            $(this).data('rawvalue',$(this).cleanVal());
        }
        $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue);

        if (removeMask && ngModelCtrl) {
          ngModelCtrl.$formatters.push(function (value) {
            if (value) {
              return $element.masked(value);
            }

            return null;
          });

          ngModelCtrl.$parsers.push(function (value) {
            if (value) {
              return $element.cleanVal();
            }

            return null;
          });
        }
      }
      else {
        if ($element.attr('from-grid')) {
          var unmaskedvalue = function() {
            $(this).data('rawvalue',$(this).val());
          }
          $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue);
        }
      }
    }
  }
}

function parseMaskType(type, $translate) {
  if (type == "datetime" || type == "datetime-local") {
    type = $translate.instant('Format.DateTime');
    if (type == 'Format.DateTime')
      type = 'DD/MM/YYYY HH:mm:ss'
  }

  else if (type == "date") {
    type = $translate.instant('Format.Date');
    if (type == 'Format.Date')
      type = 'DD/MM/YYYY'
  }

  else if (type == "time" || type == "time-local") {
    type = $translate.instant('Format.Hour');
    if (type == 'Format.Hour')
      type = 'HH:mm:ss'
  }

  else if (type == "month") {
    type = 'MMMM';
  }

  else if (type == "number") {
    type = $translate.instant('Format.Decimal');
    if (type == 'Format.Decimal')
      type = '#.#00,00'
  }

  else if (type == "money" || type == "money-decimal") {
    type = $translate.instant('Format.Money');
    if (type == 'Format.Money')
      type = '#.#00,00'
  }

  else if (type == "integer") {
    type = $translate.instant('Format.Integer');
    if (type == 'Format.Integer')
      type = '#,##0.####';
  }

  else if (type == "week") {
    type = 'dddd';
  }

  else if (type == "tel") {
    type = '(00) 00000-0000;0';
  }

  else if (type == "text") {
    type = '';
  }

  else if (type == "string") {
    type = '';
  }

  return type;
}

function transformText() {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function(scope, elem, attrs, ngModelCtrl) {

      var textTransform = function(element, value) {
        if (element) {
          if (value !== undefined && value !== null) {
            if(element.css('text-transform') === 'uppercase'){
              return value.toUpperCase();
            } else if(element.css('text-transform') === 'lowercase'){
              return value.toLowerCase();
            }
          }
          return value;
        }
      }

      if (ngModelCtrl) {
        ngModelCtrl.$formatters.push(function (result) {
          return textTransform(elem,result)
        });

        ngModelCtrl.$parsers.push(function (result) {
          return textTransform(elem,result)
        });
      }
    }
  }
}



app.kendoHelper = {
  getSchema: function(dataSource) {
    var parseAttribute = [
      { kendoType: "string", entityType: ["string", "character", "uuid", "guid"] },
      { kendoType: "number", entityType: ["integer", "long", "double", "int", "float", "bigdecimal", "single", "int32", "int64", "decimal", "byte"] },
      { kendoType: "date", entityType: ["date", "time", "datetime"] },
      { kendoType: "boolean", entityType: ["boolean"] }
    ];

    var parseType = function(type) {
      for (var i = 0; i < parseAttribute.length; i++) {
        if (parseAttribute[i].entityType.includes(type.toLocaleLowerCase()))
          return parseAttribute[i].kendoType;
      }
      return "string";
    };

    var schema = {
      model : {
        id : "__$id",
        fields: {}
      }
    };
    if (dataSource && dataSource.schemaFields) {
      dataSource.schemaFields.forEach(function(field) {
        schema.model.fields[field.name] = {
          type: parseType(field.type),
          editable: true,
          nullable: field.nullable,
          validation: { required: !field.nullable },
        }
      });
      schema.model.fields["__$id"] = {
        type: "string",
        editable: true,
        nullable: true,
        validation: { required: false }
      }
    }
    return schema;
  },
  getDataSource: function(dataSource, scope, allowPaging, pageCount, columns, groupings) {
    var schema = this.getSchema(dataSource);
    if (columns) {
      columns.forEach(function(c) {
        for (var key in schema.model.fields) {
          if (c.dataType == "Database" && c.field == key ) {
            schema.model.fields[key].nullable = !c.required;
            schema.model.fields[key].validation.required = c.required;
            break;
          }
        }
      });
    }

    var parseParameter = function(data) {
      for (var attr in data) {
        if (schema.model.fields.hasOwnProperty(attr)) {

          var schemaField = schema.model.fields[attr];
          if (schemaField.type == 'string' && data[attr] != undefined)
            data[attr] = data[attr] + "";
          else if (schemaField.type == 'number' && data[attr] != undefined)
            data[attr] = parseFloat(data[attr]);
          else if (schemaField.type == 'date' && data[attr] != undefined)
            data[attr] = '/Date('+data[attr].getTime()+')/';
          else if (schemaField.type == 'boolean') {
            if (data[attr] == undefined)
              data[attr] = false;
            else
              data[attr] = data[attr].toString().toLowerCase() == "true"?true:false;
          }

          //Significa que é o ID
          if (schema.model.id == attr) {
            //Se o mesmo for vazio, remover do data
            if (data[attr] != undefined && data[attr].toString().length == 0)
              delete data[attr];
          }
        }
      }
      return data;
    };

    var pageSize = 10;
    if (scope[dataSource.name])
      pageSize = scope[dataSource.name].rowsPerPage;

    //Quando não for data UTC
    var offsetMiliseconds = new Date().getTimezoneOffset() * 60000;
    function onRequestEnd(e) {
      if (e.response  && e.response.d ) {
        var items = null;
        if (e.response.d.results)
          items = e.response.d.results;
        else
          items = [e.response.d];

        if (this.group().length) {

          columns.forEach( function(c) {
            if (c.dataType == 'Database') {
              var notUseUTC = c.type == 'datetime-local' || c.type == 'month' || c.type == 'time-local' || c.type == 'week';
              if (notUseUTC) {
                for (var i = 0; i < items.length; i++) {
                  var gr = items[i];
                  if (c.field == gr.Member) {
                    gr.Key = gr.Key.replace(/\d+/,
                        function (n) { return parseInt(n) + offsetMiliseconds }
                    );
                  }
                  addOffset.bind(this)(gr.Items);
                }
              }
            }
          });
        } else {
          addOffset.bind(this)(items);
        }
      }
    }

    function addOffset(items) {
      for (var i = 0; i < items.length; i++) {
        if (columns) {
          columns.forEach( function(c) {
            if (c.dataType == 'Database') {
              var notUseUTC = c.type == 'datetime-local' || c.type == 'month' || c.type == 'time-local' || c.type == 'week';
              if (notUseUTC) {
                if (items[i][c.field]) {
                  items[i][c.field] = items[i][c.field].replace(/\d+/,
                      function (n) { return parseInt(n) + offsetMiliseconds }
                  );
                }
              }
            }
          });
        }

      }
    }

    function getAggregate(columns) {
      var aggregates = [];
      if (columns) {
        columns.forEach(function(c) {
          if (c.aggregates) {
            c.aggregates.forEach(function(ag) {
              aggregates.push({field: c.field, aggregate: ag.type});
            });
          }
        });
      }
      return aggregates;
    }

    var datasourceId = app.common.generateId();
    var datasource = {
      transport: {
        setActiveAndPost: function(e) {
          var cronappDatasource = this.options.cronappDatasource;
          scope.safeApply(cronappDatasource.updateActive(parseParameter(e.data)));
          cronappDatasource.active.__sender = datasourceId;
          cronappDatasource.postSilent(
              function(data) {
                this.options.enableAndSelect(e);
                e.success(data);
                this.options.grid.dataSource._pristineTotal = this.options.grid.dataSource._pristineData.push(data);
              }.bind(this),
              function(data) {
                this.options.enableAndSelect(e);
                e.error(data, data, data);
              }.bind(this)
          );
        },
        push: function(callback) {
          if (!this.options.dataSourceEventsPush && this.options.cronappDatasource) {
            this.options.dataSourceEventsPush = {
              create: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushUpdate(data);
                }
                else
                  this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
              }.bind(this),
              update: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushUpdate(data);
                }
                else
                  this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
              }.bind(this),
              delete: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushDestroy(data);
                }
                else
                  this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
              }.bind(this),
              overRideRefresh: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  this.options.grid.dataSource.read();
                }
              }.bind(this),
              read: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  this.options.fromRead = true;
                  this.options.grid.dataSource.read();
                }
              }.bind(this),
              memorycreate: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushUpdate(data);
                }
                else
                  this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
              }.bind(this),
              memoryupdate: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushUpdate(data);
                }
                else
                  this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
              }.bind(this),
              memorydelete: function(data) {
                if (this.options.isGridInDocument(this.options.grid)) {
                  var current = this.options.getCurrentCallbackForPush(callback, this.options.grid);
                  current.pushDestroy(data);
                }

              }.bind(this)
            };

            if (this.origin == 'combobox') {
              delete this.options.dataSourceEventsPush['overRideRefresh'];
            }
            this.options.cronappDatasource.addDataSourceEvents(this.options.dataSourceEventsPush);
          }
        },
        read:  function (e) {

          var doFetch = false;
          try {
            var cronappDatasource = this.options.cronappDatasource;
            var grid = this.options.grid;

            if (!this.options.kendoCallback) {
              this.options.kendoCallback = e;
              doFetch = true;
            }
            else {
              if (this.options.fromRead) {
                this.options.kendoCallback.success(cronappDatasource.data);
              }
              else {
                doFetch = true;
              }
            }
          } finally {
            this.options.fromRead = false;
          }

          if (doFetch) {
            for (key in e.data)
              if(e.data[key] == undefined)
                delete e.data[key];
            var paramsOData = kendo.data.transports.odata.parameterMap(e.data, 'read');
            var orderBy = '';

            if (this.options.grid) {
              this.options.grid.dataSource.group().forEach(function(group) {
                orderBy += group.field +" " + group.dir + ",";
              });
            }
            if (orderBy.length > 0) {
              orderBy = orderBy.substr(0, orderBy.length-1);
              if (paramsOData.$orderby)
                paramsOData.$orderby =  orderBy + "," + paramsOData.$orderby;
              else
                paramsOData.$orderby = orderBy;
            }

            var cronappDatasource = this.options.cronappDatasource;
            cronappDatasource.rowsPerPage = e.data.pageSize;
            cronappDatasource.offset = (e.data.page - 1);

            //Significa que quer exibir todos
            if (!e.data.pageSize) {
              cronappDatasource.offset = undefined
              delete paramsOData.$skip;
              if (this.options.grid) {
                //Se houver grade associado, e a pagina não for a primeira, cancela a chamada atual, e faz novamente selecionando a pagina 1
                if (this.options.grid.dataSource.page() != 1) {
                  this.options.grid.dataSource.page(1);
                  e.error("canceled", "canceled", "canceled");
                  return;
                }
              }
            }

            var fetchData = {};
            fetchData.params = paramsOData;
            var append = false;
            if (dataSource.append) {
              append = dataSource.append;
            }
            cronappDatasource.append = append;
            cronappDatasource.fetch(fetchData, {
              success:  function(data) {
                e.success(data);
              },
              canceled:  function(data) {
                e.error("canceled", "canceled", "canceled");
              }
            }, append);
          }

        },
        update: function(e) {
          this.setActiveAndPost(e);
        },
        create: function (e) {
          this.setActiveAndPost(e);
        },
        destroy: function(e) {
          cronappDatasource = this.options.cronappDatasource;
          cronappDatasource.removeSilent(e.data,
              function(data) {
                e.success(data);
              },
              function(data) {
                e.error("canceled", "canceled", "canceled");
              }
          );
        },
        batch: function (e) {
        },
        options: {
          fromRead: false,
          disableAndSelect: function(e) {
            if (this.isGridInDocument(this.grid)) {
              this.grid.select(e.container);
              this.grid.options.selectable = false;
              if (this.grid.selectable && this.grid.selectable.element) {
                this.grid.selectable.destroy();
                this.grid.selectable = null;
              }
            }
          },
          enableAndSelect: function(e) {
            if (this.isGridInDocument(this.grid)) {
              this.grid.options.selectable = this.grid.options.originalSelectable;
              this.grid._selectable();
              this.grid.select(e.container);
            }
          },
          selectActiveInGrid: function(data) {
            //Verifica se já existe a grid
            if (this.isGridInDocument(this.grid)) {
              //Verifica se tem a opção selecionavel setada e se tem registros
              if (this.grid.selectable && this.grid.dataItems().length > 0) {
                //Se já existir o active setado, verifica se tem na grade
                if (this.cronappDatasource.active && this.cronappDatasource.active.__$id) {
                  var items = this.grid.dataItems();
                  var idxSelected = -1;
                  for (var idx = 0; idx < items.length; idx++) {
                    if (this.cronappDatasource.active.__$id == items[idx].__$id) {
                      idxSelected = idx;
                      break;
                    }
                  }
                  if (idxSelected >-1 && !this.grid.selectable.options.multiple)
                    this.grid.select(this.grid.table.find('tr')[idxSelected]);
                }
              }
            }
          },
          isGridInDocument: function(grid) {
            if (!grid) return false;
            //Se não tiver element, significa que é
            //Verifica se a grade ainda existe
            return ($(document).has(grid.element[0]).length);
          },
          getCurrentCallbackForPush: function(callback, grid) {
            if (callback)
              return callback;
            return grid;
          },
          cronappDatasource: scope[dataSource.name]
        }
      },
      pageSize: pageSize,
      serverPaging: true,
      serverFiltering: true,
      serverSorting: true,
      batch: false,
      schema: schema,
      requestEnd: onRequestEnd
    };
    datasource.aggregate = getAggregate(columns);

    datasource.schema.total = function(){
      return datasource.transport.options.cronappDatasource.getRowsCount();
    };

    if (groupings) {
      datasource.group = [];

      groupings.forEach(function(g) {
        var group = { field: g.field, aggregates: datasource.aggregate };

        datasource.group.push(group);
      });
    }

    return datasource;
  },
  getEventReadCombo: function (e) {

    var cronappDatasource = this.options.cronappDatasource;

    if (!cronappDatasource) {
      e.error("canceled", "canceled", "canceled");
      return;
    }

    var isFirst;
    if (this.options.combobox && this.options.combobox.options.readData) {
      e.success(this.options.combobox.options.readData);
      this.options.combobox.options.readData = null;
      this.options.alreadyLoaded = true;
      return;
    } else if (this.options.combobox) {
      var isFirst = !this.options.alreadyLoaded;
    } else {
      isFirst = false;
    }

    this.options.alreadyLoaded = true;

    var doFetch = true;

    if (isFirst) {
      doFetch = false;
      if (cronappDatasource.lazy) {
        e.success([{}]);
      } else {
        e.success([]);
      }
    }

    if (doFetch) {
      for (key in e.data) {
        if(e.data[key] == undefined) {
          delete e.data[key];
        }
      }
      var paramsOData = kendo.data.transports.odata.parameterMap(e.data, 'read');

      cronappDatasource.rowsPerPage = e.data.pageSize;
      cronappDatasource.offset = (e.data.page - 1);

      var self = this;
      var silentActive = true;
      var fetchData = {};
      fetchData.params = paramsOData;
      if (self.options.combobox) {
        self.options.combobox.options.fromCombo = true;
      }
      cronappDatasource.fetch(fetchData, {
            success:  function(data) {
              if (e.success) {
                e.success(data);
                if (self.options && self.options.combobox && self.options.combobox.element[0].id) {
                  var expToFind = " .k-animation-container";
                  var x = angular.element($(expToFind));
                  self.options.$compile(x)(self.options.scope);
                }
              }
            },
            canceled:  function(data) {
              if (self.options.combobox) {
                self.options.combobox.options.fromCombo = false;
              }
              if (e.success) {
                e.error("canceled", "canceled", "canceled");
              }
            },
            error:  function(data) {
              if (self.options.combobox) {
                self.options.combobox.options.fromCombo = false;
              }
              if (e.success) {
                e.error("error", "error", "error");
              }
            }
          },
          false,
          {ignoreAtive: true}
      );
    }
  },
  getConfigCombobox: function(options, scope) {
    var valuePrimitive = false;
    var dataSource = {};
    var dataSource = {};
    var config = {};

    if (options) {
      if (!options.dynamic || options.dynamic=='false') {
        valuePrimitive = true;
        options.dataValueField = options.dataValueField || 'value';
        options.dataTextField = options.dataTextField || 'key';
        dataSource.data = (options.staticDataSource == null ? undefined : options.staticDataSource);
        for (i = 0; i < dataSource.data.length; i++) {
          try {
            dataSource.data[i].key = scope.$eval(dataSource.data[i].key);
          }
          catch (e) {
            dataSource.data[i].key = dataSource.data[i].key;
          }
        }
      }
      else if (options.dataSourceScreen && options.dataSourceScreen.entityDataSource) {
        options.dataSourceScreen.entityDataSource.append = true;
        dataSource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, true, options.dataSourceScreen.rowsPerPage);
        dataSource.transport.read = app.kendoHelper.getEventReadCombo;
        valuePrimitive = (options.valuePrimitive == null ? false : (typeof options.valuePrimitive == 'string' ? options.valuePrimitive == 'true' : options.valuePrimitive));
      }

      if (!options.dataValueField || options.dataValueField.trim() == '') {
        options.dataValueField = (options.dataTextField == null ? undefined : options.dataTextField);
      }

      var getFieldType = function(field) {
        var fields = options.dataSourceScreen.entityDataSource.schemaFields;
        for (count = 0; count < fields.length; count++) {
          if (field == fields[count].name) {
            return fields[count].type.toLowerCase();
            break;
          }
        }

        return null;
      }

      var isValidDateType = function(field) {
        var dateTypes = ["date", "time", "datetime"];
        if(dateTypes.indexOf(field) > -1){
          return field;
        }
        return null;
      }

      if (!options.customTemplate) {
        if(options.dataSourceScreen && options.dataSourceScreen.entityDataSource) {
          if (options.format || (isValidDateType(getFieldType(options.dataTextField)))) {
            options.template = "#= useMask(" + options.dataTextField + ",'" + options.format + "','" + getFieldType(options.dataTextField) + "') #";
            options.valueTemplate = "#= useMask(" + options.dataTextField + ",'" + options.format + "','" + getFieldType(options.dataTextField) + "') #";
          }
        }
      }

      var config = {
        dataTextField: (options.dataTextField == null ? undefined : options.dataTextField),
        dataValueField: (options.dataValueField == null ? undefined : options.dataValueField),
        dataSource: dataSource,
        headerTemplate: (options.headerTemplate == null ? undefined : options.headerTemplate),
        template: (options.template == null ? undefined : options.template),
        placeholder: (options.placeholder == null ? undefined : options.placeholder),
        footerTemplate: (options.footerTemplate == null ? undefined : options.footerTemplate),
        filter: (options.filter == null ? undefined : options.filter),
        valuePrimitive : valuePrimitive,
        valueTemplate : (options.valueTemplate == null ? undefined : options.valueTemplate),
        suggest: true
      };

      if (options.optionLabel) {
        options.optionLabelText = options.optionLabel;
        options.optionLabelValue = '';
      }

      config.optionLabel = {};
      config.optionLabel[config.dataTextField] = options.optionLabelText === undefined ? "" : options.optionLabelText;
      config.optionLabel[config.dataValueField] = options.optionLabelValue === undefined ? null : options.optionLabelValue;
    }

    return config;
  },
  getConfigDate: function(translate, options) {
    var config = {};

    if (config) {
      var formatCulture = function(culture) {
        culture = culture.replace(/_/gm,'-');
        var parts = culture.split('-');
        parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
        return parts.join('-');
      }

      var formatKendoMask = function(mask) {
        if (mask) {
          mask = mask.replace(/:MM/gm,':mm');
          mask = mask.replace(/:M/gm,':m');
          mask = mask.replace(/S/gm,'s');
          mask = mask.replace(/D/gm,'d');
          mask = mask.replace(/Y/gm,'y');
        }

        return mask;
      }

      var formatMomentMask = function(type, mask) {
        if (mask == null) {
          mask = parseMaskType(type, translate)
        }

        return mask;
      }

      var animation = {};
      if (options.animation) {
        try {
          animation = JSON.parse(options.animation);
        } catch(err) {
          console.log('DateAnimation invalid configuration! ' + err);
        }
      }

      var momentFormat = formatMomentMask(options.type, options.format);
      var format = formatKendoMask(momentFormat);

      var timeFormat = formatKendoMask(options.timeFormat);
      var culture = formatCulture(translate.use());

      config = {
        value: null,
        format: format,
        timeFormat: timeFormat,
        momentFormat: momentFormat,
        culture: culture,
        type: (options.type == null ? undefined : options.type),
        weekNumber: (options.weekNumber  == null ? undefined : options.weekNumber),
        dateInput: (options.dateInput == null ? undefined : options.dateInput),
        animation: animation,
        footer: (options.footer == null ? undefined : options.footer),
        start: (options.start == null ? undefined : options.start),
        depth: (options.start == null ? undefined : options.start)
      }
    }

    return config;
  },
  buildKendoMomentPicker : function($element, options, scope, ngModelCtrl) {
    var useUTC = options.type == 'date' || options.type == 'datetime' || options.type == 'time';

    if (!window.fixedTimeZone) {
      useUTC = false;
    }

    if (!$element.attr('from-grid')) {
      var onChange = function() {
        var value = $element.val();
        if (!value || value.trim() == '') {
          if (ngModelCtrl)
            ngModelCtrl.$setViewValue('');
        } else {
          var momentDate = null;

          if (useUTC) {
            momentDate = moment(value, options.momentFormat).utcOffset(window.timeZoneOffset);
          } else {
            momentDate = moment(value, options.momentFormat);
          }

          if (ngModelCtrl && momentDate.isValid()) {
            ngModelCtrl.$setViewValue(momentDate.toDate());
            $element.data('changed', true);
          }
        }
      }

      if (scope) {
        options['change'] = function() {
          scope.$apply(function () {
            onChange();
          });
        };
      } else {
        options['change'] = onChange;
      }
    }


    if (options.type == 'date') {
      return $element.kendoDatePicker(options).data('kendoDatePicker');
    } else if (options.type == 'datetime' || options.type == 'datetime-local') {
      return $element.kendoDateTimePicker(options).data('kendoDateTimePicker');
    } else if (options.type == 'time' || options.type == 'time-local') {
      return $element.kendoTimePicker(options).data('kendoTimePicker');
    }
  },
  getConfigSlider: function(options) {
    options = options || {};
    var config = {
      increaseButtonTitle: options.increaseButtonTitle,
      decreaseButtonTitle: options.decreaseButtonTitle,
      dragHandleTitle: options.dragHandleTitle
    }

    try {
      config['min'] = options.min ? parseInt(options.min) : 1;
      config['max'] = options.max ? parseInt(options.max) : 1;
      config['smallStep'] = options.smallStep ? parseInt(options.smallStep) : 1;
      config['largeStep'] = options.largeStep ? parseInt(options.largeStep) : 1;
    } catch(err) {
      console.log('Slider invalid configuration! ' + err);
    }

    return config;
  },
  getConfigSwitch: function(options) {
    options = options || {};
    var config = {
      onLabel: (options.onLabel == null ? undefined : options.onLabel),
      offLabel: (options.offLabel == null ? undefined : options.offLabel)
    }

    return config;
  },
  getConfigBarcode: function(options) {
    var config = {
      type: (options.type == null ? undefined : options.type),
      width: (options.width == null ? undefined : parseInt(options.width)),
      height: (options.height == null ? undefined : parseInt(options.height))
    }

    if (!config.type) {
      config.type = 'EAN8';
    }

    return config;
  },
  getConfigQrcode: function(options) {
    var config = {
      errorCorrection: (options.errorCorrection == null ? undefined : options.errorCorrection),
      size: (options.size == null ? undefined : parseInt(options.size)),
      color: (options.color == null ? undefined : options.color)
    }

    if (options.borderColor || options.borderSize) {
      config['border'] = {
        size: (options.size == null ? undefined : parseInt(options.size)),
        color: (options.color == null ? undefined : options.color)
      }
    }

    return config;
  }
};

window.showTreatedValue = function(value) {
  if (value || value === false){
    return value;
  }
  return '';
};

window.useMask = function(value, format, type) {
  var mask = '';
  format = format == 'null' || format == 'undefined' ? undefined : format;

  var resolvedValue = value;
  var resolvedType = format || type;

  if (value != null && value != undefined) {
    if (value instanceof Date) {

      var momentDate = moment(value).utcOffset(window.timeZoneOffset);

      resolvedValue = '"'+momentDate.format()+'"';
    }
    else if (typeof value == 'number') {
      resolvedValue = value;
    }
    else {
      resolvedValue = '"'+value+'"';
    }
    mask = '{{ ' + resolvedValue + '  | mask:"' + resolvedType + '":"'+type+'"}}';
  }

  return mask;
};
