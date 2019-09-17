(function($app) {
  angular.module('report.services', []).service('ReportService', function($http, $compile, $modal, $translate) {
    var body = $('body');
    var scope = angular.element(body.get(0)).scope();
    var scriptsStimulsoft = [
      'plugins/cronapp-lib-js/dist/js/stimulsoft/stimulsoft.viewer.css',
      'plugins/cronapp-lib-js/dist/js/stimulsoft/stimulsoft.reports.pack.js',
      'plugins/cronapp-lib-js/dist/js/stimulsoft/stimulsoft.viewer.pack.js',
      'plugins/cronapp-lib-js/dist/js/stimulsoft/stimulsoft-helper.js'
    ];
    var loadedScripts = [];

    // data
    this.getReport = function(reportName) {
      var req = {
        url : 'api/rest/report',
        method : 'POST',
        data : angular.toJson({
          'reportName' : reportName
        })
      };
      return $http(req);
    };

    // bytes[]
    this.getPDF = function(report) {
      var req = {
        url : 'api/rest/report/pdf',
        method : 'POST',
        responseType : 'arraybuffer',
        data : angular.toJson(report)
      };
      return $http(req);
    };

    // file
    this.getPDFAsFile = function(report) {
      var req = {
        url : 'api/rest/report/pdfasfile',
        method : 'POST',
        data : angular.toJson(report)
      };
      return $http(req);
    };

    this.getContentAsString = function(report) {
      var req = {
        url : 'api/rest/report/contentasstring',
        method : 'POST',
        data : angular.toJson(report)
      };
      return $http(req);
    };

    this.getDataSourcesParams = function(datasourcesInBand) {
      var req = {
        url : 'api/rest/report/getdatasourcesparams',
        method : 'POST',
        data : angular.toJson(datasourcesInBand)
      };
      return $http(req);
    };

    // open report
    this.openURLContent = function(url) {
      // Retrocompatibilidade
      var context = $('#reportViewContext');

      if(!context.get(0)) {
        console.log('include[#reportViewContext]');
        body.append('<div id="reportViewContext" ng-include="\'plugins/cronapp-framework-js/components/reports/reports.view.html\'"></div>');
        $compile(body)(scope);
      }

      var include = function() {
        var frame = $('<iframe/>');
        frame.attr('frameborder', 0);
        var h = parseInt($(window).height());

        frame.attr('height', h - 200);
        frame.attr('width', '100%');
        frame.attr('src', url + "?download=false");
        var m = $('#reportView .modal-body');
        if(m.get(0)) {
          m.html(frame);
          $('#reportViewContext .modal-dialog').css('width', '95%');
          setTimeout(function() {
            console.log('open[#reportViewContext]');
            $('body').append(context);
            $('#reportView').modal();
          }, 100);
        }
        else {
          console.log('wait[#reportViewContext]');
          setTimeout(include, 200);
        }
      }

      setTimeout(include, 200);
    };

    this.initializeStimulsoft = function(language) {
      if (!Stimulsoft.Base.StiLicense.Key) {
        stimulsoftHelper.setLanguage(language);
        var localization = stimulsoftHelper.getLocalization();
        Stimulsoft.Base.Localization.StiLocalization.loadLocalization(localization.xml);
        Stimulsoft.Base.Localization.StiLocalization.cultureName = localization.cultureName;
        Stimulsoft.Base.StiLicense.Key = stimulsoftHelper.getKey();
      }
    }

    this.openStimulsoftReport = function(json, parameters, datasourcesInBand, config) {
      var context = $('#reportViewContext');
      if(!context.get(0)) {
        body.append('<div id="reportViewContext" ng-include="\'plugins/cronapp-framework-js/components/reports/reports.view.html\'"></div>');
        $compile(body)(scope);
      }

      var h = parseInt($(window).height());
      var heightRepo = (h - 200) + "px";

      var options = new Stimulsoft.Viewer.StiViewerOptions();
      options.toolbar.showAboutButton = false;
      if (config) {
        options.toolbar.visible = config.showToolbar;
        options.appearance.scrollbarsMode = config.showScrollbar;
        if (config.height != undefined)
          options.height = config.height + "px";
      }
      else {
        options.appearance.scrollbarsMode = true;
        options.height = heightRepo;
      }

      var viewerId = "StiViewer" + app.common.generateId();
      var viewer = new Stimulsoft.Viewer.StiViewer(options, viewerId, false);
      var report = new Stimulsoft.Report.StiReport();
      report.load(json);

      if (!datasourcesInBand)
        datasourcesInBand = stimulsoftHelper.getDatasourcesInBand(report);

      if (parameters) {
        parameters.forEach(function(p) {
          datasourcesInBand.datasources.forEach(function(sp) {
            for (var i = 0; i<sp.fieldParams.length; i++) {
              if (sp.fieldParams[i].param == p.originalName) {
                sp.fieldParams[i]["value"] = p.value;
                break;
              }
            }
          });
        });
      }
      stimulsoftHelper.setParamsInFilter(report.dictionary.dataSources, datasourcesInBand.datasources);
      viewer.report = report;

      if (config && config.$element) {
        viewer.renderHtml(config.$element[0]);
      }
      else {

        function observeFullScreen() {
          var $contentReport;
          var $modalBody;
          var $headerBody;
          var $otherHeader;
          var $reportView;
          var observerInterval = setInterval(function() {
            var $renderedReport = $('#'+viewerId);
            if ($renderedReport.length) {
              if (!$contentReport) {
                $contentReport = $renderedReport.parent();
                $modalBody = $contentReport.parent();
                $headerBody = $modalBody.parent();
                $otherHeader = $headerBody.parent(); //coloca o css e coloca o 100% do width (remove modal-dialog modal-lg)
                $reportView = $otherHeader.parent(); //coloca o css (remove modal fade ng-scope in)
              }
              if ($renderedReport.css('position') == 'absolute' && $modalBody.data('applied') != 'absolute') {
                $modalBody.data('applied', 'absolute');
                $modalBody.removeClass('modal-body');
                $headerBody.removeClass('modal-content');

                $otherHeader.attr('style','top: 0px;right: 0px;bottom: 0px;left: 0px;z-index: 1000000;position: absolute;');
                $otherHeader.removeClass('modal-dialog');
                $otherHeader.removeClass('modal-lg');

              }
              else if ($renderedReport.css('position') == 'static' && $modalBody.data('applied') != 'static' ) {
                $modalBody.data('applied', 'static');
                $modalBody.addClass('modal-body');
                $headerBody.addClass('modal-content');

                $otherHeader.attr('style','width:95%');
                $otherHeader.addClass('modal-dialog');
                $otherHeader.addClass('modal-lg');

              }
            }
            else {
              console.log('cleared interval: ' + viewerId);
              clearInterval(observerInterval);
            }
          }, 100);
        }

        var include = setInterval(function() {
          var div = $('<div/>');
          div.attr('id',"contentReport");
          div.attr('width', '100%');
          // div.css('height', heightRepo);
          var m = $('#reportView .modal-body');
          if(m.get(0)) {
            m.html(div);
            $('#reportViewContext .modal-dialog').css('width', '95%');
            setTimeout(function() {
              console.log('open[#reportViewContext]');
              $('body').append(context);
              $('#reportView').modal();
              viewer.renderHtml("contentReport");
              setTimeout(function() { observeFullScreen() },100);
            }, 100);

            clearInterval(include);
          }
        }, 200);
      }


    };

    this.showParameters = function(report) {
      var parameters = report.parameters;
      var htmlParameters = [];
      var index = 0;
      var escapeRegExp = function(str) {
        return str.replace(/([.*+?^=!:()|\[\]\/\\])/g, "\\$1");
      };
      var replaceAll = function(str, find, replace) {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
      };

      var next = function() {
        if(index < parameters.length) {
          var parameter = parameters[index++];
          $.get("plugins/cronapp-framework-js/components/reports/" + parameter.type + ".parameter.html").done(function(result) {
            htmlParameters.push(replaceAll(result, "_field_", parameter.name));
            next();
          });
        }
        else if(htmlParameters.length > 0) {
          $modal.open({
            templateUrl : 'plugins/cronapp-framework-js/components/reports/reports.parameters.html',
            controller : 'ParameterController',
            resolve : {
              report : function() {
                return JSON.parse(JSON.stringify(report));
              },
              htmlParameters : function() {
                return JSON.parse(JSON.stringify(htmlParameters));
              }
            }
          });
        }
      }.bind(this);
      next();
    };

    this.mergeParam = function(parameters, params) {
      var getValue = function(key, json) {
        for (var i in Object.keys(json)) {
          var k = Object.keys(json[i])[0];
          if (key == k)
            return Object.values(json[i])[0];
        }
      };
      for (var i in Object.keys(parameters)) {
        var k = parameters[i].name;
        var v = parameters[i].value;
        var valueParam = getValue(k, params);
        if (valueParam) {
          parameters[i].value = valueParam;
        }
      }
      return parameters;
    };

    this.setVariablesBasedOnParams = function(variablesReference, variables){
      for(var variableIndex in variables){
        var variableName = Object.keys(variables[variableIndex])[0];
        var variableValue = variables[variableIndex][variableName];
        for(var variableReferenceKey in variablesReference){
          if(variablesReference[variableReferenceKey] && variablesReference[variableReferenceKey].Name && variablesReference[variableReferenceKey].Name === variableName){
            variablesReference[variableReferenceKey].Value = variableValue;
            break;
          }
        }
      }
    };

    this.hasParameterWithOutValue = function(parameters) {
      var hasWithOutValue = false;
      for (var i in Object.keys(parameters)) {
        if (!parameters[i].value) {
          return true;
        }
      }
      return hasWithOutValue;
    };

    this.getDatasourcesInBand = function(json) {

      var report = new Stimulsoft.Report.StiReport();
      report.load(json);

      var datasourcesInBand = stimulsoftHelper.getDatasourcesInBand(report);
      return datasourcesInBand;

    };

    this.loadSriptsStimulsoft = function(callback) {
      var loadedAllSuccess = true;
      var total = scriptsStimulsoft.length;
      var totalAdded = 0;

      Pace.options.initialRate = 0.7;
      Pace.options.minTime = 1750;
      Pace.options.maxProgressPerFrame = 1;
      Pace.options.ghostTime = 120000;
      Pace.restart();

      scriptsStimulsoft.forEach(function(url, idx) {
        this.loadScript(url, function(success) {
          totalAdded++;
          if (!success)
            loadedAllSuccess = false;
          if (totalAdded == total) {
            Pace.options.initialRate = 0.03;
            Pace.options.minTime = 250;
            Pace.options.maxProgressPerFrame = 20;
            Pace.options.ghostTime = 10;
            Pace.stop();
            callback(loadedAllSuccess);
          }
        });
      }.bind(this));
    }

    this.loadScript = function(url, callback) {
      if($.inArray(url, loadedScripts) >= 0) {
        callback && callback(true);
        return;
      }

      if(url.indexOf(".css") != -1) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.media = 'all';
        link.onload = function() {
          loadedScripts.push(url);
          callback && callback(true);
        };
        link.onerror = function() {
          callback && callback(false);
        };
        try {
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        catch(ex) {
          console.log(ex);
        }
      }
      else {
        var script = document.createElement("script")
        script.type = "text/javascript";
        if(script.readyState) { // IE
          script.onreadystatechange = function() {
            if(script.readyState == "loaded" || script.readyState == "complete") {
              script.onreadystatechange = null;
              loadedScripts.push(url);
              callback && callback(true);
            }
          };
        }
        else { // Others
          script.onload = function() {
            loadedScripts.push(url);
            callback && callback(true);
          };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
      }
    }

    this.openReport = function(reportName, params, config) {
      this.getReport(reportName).then(function(result) {
        if(result && result.data) {
          if (result.data.reportName.endsWith('.report')) {

            this.loadSriptsStimulsoft(function(success) {
              if (success) {
                this.initializeStimulsoft($translate.use());
                this.getContentAsString(result.data).then(
                    function (content) {

                      var datasourcesInBand = this.getDatasourcesInBand(content.data);
                      //Verificar se existem parametros na Fonte de dados dos datasources utilizados no relatorio
                      this.getDataSourcesParams(datasourcesInBand).then(function(dsInBand) {

                        datasourcesInBand = dsInBand.data;
                        //Compatibilizar os tipos para o relatório antigo
                        result.data.parameters = stimulsoftHelper.parseToGroupedParam(datasourcesInBand.datasources);
                        result.data.contentData = content.data;
                        result.data.datasourcesInBand = datasourcesInBand;

                        if (params) {
                          result.data.parameters = this.mergeParam(result.data.parameters, params);
                          result.data.contentData.Dictionary = result.data.contentData.Dictionary || {};
                          this.setVariablesBasedOnParams(result.data.contentData.Dictionary.Variables, params);
                        }
                        if (this.hasParameterWithOutValue(result.data.parameters) && !config) {
                          //Traduz o nome dos parametros
                          result.data.parameters.forEach(function (p) {
                            p.name = $translate.instant(p.name);
                          });
                          this.showParameters(JSON.parse(JSON.stringify(result.data)));
                        }
                        else {
                          this.openStimulsoftReport(content.data, result.data.parameters, result.data.datasourcesInBand, config);
                        }

                      }.bind(this));

                    }.bind(this),
                    function (data) {
                      var message = cronapi.internal.getErrorMessage(data, data.statusText);
                      scope.Notification.error(message);
                    }.bind(this)
                );
              }
              else {
                scope.Notification.error("Error loading report script");
              }

            }.bind(this));
          }
          else {
            // Abrir direto o relatorio , caso não haja parametros
            if(result.data.parameters.length == 0 || (result.data.parameters.length == 1 && result.data.parameters[0].name == 'DATA_LIMIT')) {
              this.getPDFAsFile(result.data.reportName).then(function(obj) {
                this.openURLContent(obj.data);
              }.bind(this), function(data) {
                var message = cronapi.internal.getErrorMessage(data, data.statusText);
                scope.Notification.error(message);
              }.bind(this));
            }
            else {
              if (params)
                result.data.parameters = this.mergeParam(result.data.parameters, params);
              if (this.hasParameterWithOutValue(result.data.parameters)) {
                this.showParameters(JSON.parse(JSON.stringify(result.data)));
              } else {
                this.getPDFAsFile(result.data).then(function(obj) {
                  this.openURLContent(obj.data);
                }.bind(this));
              }
            }
          }
        }
      }.bind(this));
    };

  });
}(app));