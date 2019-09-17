//v2.0.22
var ISO_PATTERN  = new RegExp("(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))");
var TIME_PATTERN  = new RegExp("PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)(?:\\.(\\d+)?)?S)?");
var DEP_PATTERN  = new RegExp("\\{\\{(.*?)\\|raw\\}\\}");

angular.module('datasourcejs', [])

/**
 * Global factory responsible for managing all datasets
 */
.factory('DatasetManager', ['$http', '$q', '$timeout', '$rootScope', '$window', 'Notification', function($http, $q, $timeout, $rootScope, $window, Notification) {
  // Global dataset List
  this.datasets = {};

  /**
   * Class representing a single dataset
   */
  var DataSet = function(name, scope) {

    var NO_IMAGE_UPLOAD = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjEyOHB4IiBoZWlnaHQ9IjEyOHB4IiB2aWV3Qm94PSIwIDAgNDQuNTAyIDQ0LjUwMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQuNTAyIDQ0LjUwMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik05Ljg2MiwzNS42MzhoMjQuNzc5YzAtNS41NDYtMy44NjMtMTAuMjAzLTkuMTEzLTExLjYwNGMyLjc1LTEuMjQ4LDQuNjY4LTQuMDEzLDQuNjY4LTcuMjI5ICAgIGMwLTQuMzg4LTMuNTU5LTcuOTQyLTcuOTQyLTcuOTQyYy00LjM4NywwLTcuOTQzLDMuNTU3LTcuOTQzLDcuOTQyYzAsMy4yMTksMS45MTYsNS45OCw0LjY2OCw3LjIyOSAgICBDMTMuNzI1LDI1LjQzNSw5Ljg2MiwzMC4wOTIsOS44NjIsMzUuNjM4eiIgZmlsbD0iIzkxOTE5MSIvPgoJCTxwYXRoIGQ9Ik0xLjUsMTQuMTY5YzAuODI4LDAsMS41LTAuNjcyLDEuNS0xLjVWNC4zMzNoOC4zMzZjMC44MjgsMCwxLjUtMC42NzIsMS41LTEuNWMwLTAuODI4LTAuNjcyLTEuNS0xLjUtMS41SDIuNzc1ICAgIEMxLjI0NCwxLjMzMywwLDIuNTc3LDAsNC4xMDh2OC41NjFDMCwxMy40OTcsMC42NywxNC4xNjksMS41LDE0LjE2OXoiIGZpbGw9IiM5MTkxOTEiLz4KCQk8cGF0aCBkPSJNNDEuNzI3LDEuMzMzaC04LjU2MmMtMC44MjcsMC0xLjUsMC42NzItMS41LDEuNWMwLDAuODI4LDAuNjczLDEuNSwxLjUsMS41aDguMzM2djguMzM2YzAsMC44MjgsMC42NzMsMS41LDEuNSwxLjUgICAgczEuNS0wLjY3MiwxLjUtMS41di04LjU2QzQ0LjUwMiwyLjU3OSw0My4yNTYsMS4zMzMsNDEuNzI3LDEuMzMzeiIgZmlsbD0iIzkxOTE5MSIvPgoJCTxwYXRoIGQ9Ik00My4wMDIsMzAuMzMzYy0wLjgyOCwwLTEuNSwwLjY3Mi0xLjUsMS41djguMzM2aC04LjMzNmMtMC44MjgsMC0xLjUsMC42NzItMS41LDEuNXMwLjY3MiwxLjUsMS41LDEuNWg4LjU2ICAgIGMxLjUzLDAsMi43NzYtMS4yNDYsMi43NzYtMi43NzZ2LTguNTZDNDQuNTAyLDMxLjAwNSw0My44MywzMC4zMzMsNDMuMDAyLDMwLjMzM3oiIGZpbGw9IiM5MTkxOTEiLz4KCQk8cGF0aCBkPSJNMTEuMzM2LDQwLjE2OUgzdi04LjMzNmMwLTAuODI4LTAuNjcyLTEuNS0xLjUtMS41Yy0wLjgzLDAtMS41LDAuNjcyLTEuNSwxLjV2OC41NmMwLDEuNTMsMS4yNDQsMi43NzYsMi43NzUsMi43NzZoOC41NjEgICAgYzAuODI4LDAsMS41LTAuNjcyLDEuNS0xLjVTMTIuMTY1LDQwLjE2OSwxMS4zMzYsNDAuMTY5eiIgZmlsbD0iIzkxOTE5MSIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=";

    var NO_FILE_UPLOAD = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNTQ4LjE3NiA1NDguMTc2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NDguMTc2IDU0OC4xNzY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8cGF0aCBkPSJNNTI0LjMyNiwyOTcuMzUyYy0xNS44OTYtMTkuODktMzYuMjEtMzIuNzgyLTYwLjk1OS0zOC42ODRjNy44MS0xMS44LDExLjcwNC0yNC45MzQsMTEuNzA0LTM5LjM5OSAgIGMwLTIwLjE3Ny03LjEzOS0zNy40MDEtMjEuNDA5LTUxLjY3OGMtMTQuMjczLTE0LjI3Mi0zMS40OTgtMjEuNDExLTUxLjY3NS0yMS40MTFjLTE4LjA4MywwLTMzLjg3OSw1LjkwMS00Ny4zOSwxNy43MDMgICBjLTExLjIyNS0yNy40MS0yOS4xNzEtNDkuMzkzLTUzLjgxNy02NS45NWMtMjQuNjQ2LTE2LjU2Mi01MS44MTgtMjQuODQyLTgxLjUxNC0yNC44NDJjLTQwLjM0OSwwLTc0LjgwMiwxNC4yNzktMTAzLjM1Myw0Mi44MyAgIGMtMjguNTUzLDI4LjU0NC00Mi44MjUsNjIuOTk5LTQyLjgyNSwxMDMuMzUxYzAsMi40NzQsMC4xOTEsNi41NjcsMC41NzEsMTIuMjc1Yy0yMi40NTksMTAuNDY5LTQwLjM0OSwyNi4xNzEtNTMuNjc2LDQ3LjEwNiAgIEM2LjY2MSwyOTkuNTk0LDAsMzIyLjQzLDAsMzQ3LjE3OWMwLDM1LjIxNCwxMi41MTcsNjUuMzI5LDM3LjU0NCw5MC4zNThjMjUuMDI4LDI1LjAzNyw1NS4xNSwzNy41NDgsOTAuMzYyLDM3LjU0OGgzMTAuNjM2ICAgYzMwLjI1OSwwLDU2LjA5Ni0xMC43MTEsNzcuNTEyLTMyLjEyYzIxLjQxMy0yMS40MDksMzIuMTIxLTQ3LjI0NiwzMi4xMjEtNzcuNTE2QzU0OC4xNzIsMzM5Ljk0NCw1NDAuMjIzLDMxNy4yNDgsNTI0LjMyNiwyOTcuMzUyICAgeiBNMzYyLjcyOSwyODkuNjQ4Yy0xLjgxMywxLjgwNC0zLjk0OSwyLjcwNy02LjQyLDIuNzA3aC02My45NTN2MTAwLjUwMmMwLDIuNDcxLTAuOTAzLDQuNjEzLTIuNzExLDYuNDIgICBjLTEuODEzLDEuODEzLTMuOTQ5LDIuNzExLTYuNDIsMi43MTFoLTU0LjgyNmMtMi40NzQsMC00LjYxNS0wLjg5Ny02LjQyMy0yLjcxMWMtMS44MDQtMS44MDctMi43MTItMy45NDktMi43MTItNi40MlYyOTIuMzU1ICAgSDE1NS4zMWMtMi42NjIsMC00Ljg1My0wLjg1NS02LjU2My0yLjU2M2MtMS43MTMtMS43MTQtMi41NjgtMy45MDQtMi41NjgtNi41NjZjMC0yLjI4NiwwLjk1LTQuNTcyLDIuODUyLTYuODU1bDEwMC4yMTMtMTAwLjIxICAgYzEuNzEzLTEuNzE0LDMuOTAzLTIuNTcsNi41NjctMi41N2MyLjY2NiwwLDQuODU2LDAuODU2LDYuNTY3LDIuNTdsMTAwLjQ5OSwxMDAuNDk1YzEuNzE0LDEuNzEyLDIuNTYyLDMuOTAxLDIuNTYyLDYuNTcxICAgQzM2NS40MzgsMjg1LjY5NiwzNjQuNTM1LDI4Ny44NDUsMzYyLjcyOSwyODkuNjQ4eiIgZmlsbD0iI2NlY2VjZSIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=";

    // Publiic members
    this.Notification = Notification;
    this.$scope = scope;
    this.noImageUpload = NO_IMAGE_UPLOAD;
    this.noFileUpload = NO_FILE_UPLOAD;

    this.$apply = function(fc) {
      scope.safeApply(fc);
    }.bind(scope);

    this.columns = [];
    this.data = [];
    this.name = name;
    this.keys = [];
    this.enabled = true;
    this.endpoint = null;
    this.active = {};
    this.inserting = false;
    this.editing = false;
    this.fetchSize = 2;
    this.observers = [];
    this.rowsPerPage = null;
    this.append = true;
    this.headers = null;
    this.responseHeaders = null;
    this._activeValues = null;
    this.errorMessage = "";
    this.onError = null;
    this.links = null;
    this.loadedFinish = null;
    this.lastFilterParsed = null;
    this.rowsCount = -1;
    this.events = {};

    this.busy = false;
    this.cursor = 0;
    this._savedProps;
    this.hasMoreResults = false;
    this.loaded = false;
    this.unregisterDataWatch = null;
    this.dependentBufferLazyPostData = null;
    this.lastAction = null; //TRM
    this.dependentData = null; //TRM
    this.hasMemoryData = false;
    this.batchPost= false;
    this.caseInsensitive = null;
    this.terms = null;
    this.checkRequired = true;
    this.schema;
    var _self = this;
    var service = null;

    this.odataFile = [];

    function reverseArr(input) {
      if (input) {
        var ret = new Array;
        for (var i = input.length - 1; i >= 0; i--) {
          ret.push(input[i]);
        }
        return ret;
      } else {
        return [];
      }
    }

    this.destroy = function() {
    }

    // Public methods

    /**
     * Initialize a single datasource
     */
    this.init = function() {

      var dsScope = this;

      // Get the service resource
      service = {
        save: function(object) {
          return this.call(_self.entity, "POST", object, true);
        },
        update: function(url, object) {
          return this.call(url, "PUT", object, false);
        },
        remove: function(url) {
          return this.call(url, "DELETE", null, true);
        },
        call: function(url, verb, obj, applyScope) {
          var object = {};
          var isCronapiQuery = (url.indexOf('/cronapi/query/') >= 0);

          if (isCronapiQuery) {
            object.inputs = [obj];

            var fields = {};

            var _callback;
            var _callbackError;
            _self.busy = true;
            url = url.replace('/specificSearch', '');
            url = url.replace('/generalSearch', '');

            if (_self && _self.$scope && _self.$scope.vars) {
              fields["vars"] = {};
              for (var attr in _self.$scope.vars) {
                fields.vars[attr] = _self.$scope.vars[attr];
              }
            }

            for (var key in _self.$scope) {
              if (_self.$scope[key] && _self.$scope[key].constructor && _self.$scope[key].constructor.name == "DataSet") {
                fields[key] = {};
                fields[key].active = _self.$scope[key].active;
              }
            }

            object.fields = fields;
          } else {
            object = obj;
          }

          var cloneObject = {};
          _self.copy(object, cloneObject, true);
          delete cloneObject.__original;
          delete cloneObject.__status;
          delete cloneObject.__originalIdx;
          delete cloneObject.__sender;
          delete cloneObject.__$id;
          delete cloneObject.__parentId;
          delete cloneObject.$$hashKey;
          delete cloneObject.__fromMemory;
          delete cloneObject.__odatafiles;

          for (var key in cloneObject) {
            if (key.indexOf('__odataFile_') > -1) {
              cloneObject[key.replace('__odataFile_','')] = undefined;
              delete cloneObject[key];
            }
          }

          // Get an ajax promise
          this.$promise = _self.getService(verb)({
            method: verb,
            url: _self.removeSlash(((window.hostApp || "") + url)),
            data: (object) ? JSON.stringify(cloneObject) : null,
            headers: _self.headers,
            rawData: (object) ? cloneObject : null
          }).success(function(data, status, headers, config) {
            _self.busy = false;
            if(_self.$scope.$ionicLoading) {
              _self.$scope.$ionicLoading.hide();
            }
            if (_callback) {
              if (_self.isOData()) {
                if (data.d != null && data.d.result != null) {
                  _self.normalizeData(data.d.result);
                  _callback(data.d.result, true);
                } else if (data.d != null) {
                  _self.normalizeObject(data.d);
                  _callback(data.d, true);
                } else {
                  _callback(data, true);
                }
              } else {
                _callback(isCronapiQuery?data.value:data, true);
              }
            }
            if (isCronapiQuery || _self.isOData()) {
              var commands = data;
              if (_self.isOData()) {
                commands = {};
                commands.commands = data.__callback;
                _self.normalizeData(commands.commands);
              }
              _self.$scope.cronapi.evalInContext(JSON.stringify(commands));
            }
          }).error(function(data, status, headers, config) {
            _self.busy = false;
            if(_self.$scope.$ionicLoading) {
              _self.$scope.$ionicLoading.hide();
            }
            var msg;
            if (_self.isOData()) {
              msg = data.error.message.value;
            } else {
              msg = isCronapiQuery&&data.value?data.value:data
            }
            _self.handleError(msg);
            if (_callbackError) {
              _callbackError(msg);
            }
          });

          this.$promise.then = function(callback) {
            if(_self.$scope.$ionicLoading) {
              var data = (object) ? cloneObject : null;
              for (var key in data) {
                if (_self.$scope.cronapi.internal.isBase64(data[key])) {
                  _self.$scope.$ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                  });
                  break;
                }
              }
            }
            _callback = callback;
            return this;
          }

          this.$promise.error = function(callback) {
            _callbackError = callback;
            return this;
          }
          return this;
        }
      }

      this.getIndexedDB = function(properties) {
        if (!window.indexedDB) {
          window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
          window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
          window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        }

        return  {
          properties: properties,
          successCallback: null,
          errorCallback: null,
          type: null,
          args: null,
          success: function(successCallback) {
            this.successCallback = successCallback;
            return this;
          },

          error: function(errorCallback) {
            this.errorCallback = errorCallback;
            return this;
          },

          post: function() {
            this.type = 'put';
            this.args = arguments;
            return this;
          },

          put: function() {
            this.type = 'put';
            this.args = arguments;
            return this;
          },

          delete: function() {
            this.type = 'delete';
            this.args = arguments;
            return this;
          },

          get: function() {
            this.type = 'getAll';
            this.args = arguments;
            return this;
          },

          call: function() {
            request = window.indexedDB.open(this.properties.dbname, this.properties.dbversion||1);

            request.onerror = function (event) {
              if (this.errorCallback) {
                this.errorCallback(event);
              }
            }.bind(this);

            request.onsuccess = function (event) {
              this.proceed(event.target.result);
            }.bind(this);

            request.onupgradeneeded = function (event) {
              var db = event.target.result;

              var objectStore = db.createObjectStore(this.properties.objectStore, {keyPath: this.properties.key});

              objectStore.transaction.oncomplete = function(event) {
                var objectStore = db.transaction(this.properties.objectStore, "readwrite").objectStore(this.properties.objectStore);
                objectStore.add({id: 123, name: 'Jose'});
              }.bind(this);

            }.bind(this);

          },

          proceed: function(db) {
            if (this.type) {
              var transaction = db.transaction(this.properties.objectStore, "readwrite")
              var store = transaction.objectStore(this.properties.objectStore);
              var request = store[this.type].apply(store, this.args);
              request.onsuccess = function(event) {
                if (this.successCallback) {
                  if (this.type === 'put') {
                    this.successCallback(this.args[0]);
                  } else {
                    this.successCallback(event.target.result);
                  }
                }
              }.bind(this);
            } else {
              if (this.successCallback) {
                this.successCallback();
              }
            }

          }
        };

      }

      this.uuidv4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      this.getService = function(verb) {
        var event = eval("this.on"+verb);

        if (event || this.isLocalData()) {
          return function(properties) {
            var promise = {
              verb: verb,
              properties: properties,
              successCallback: null,
              errorCallback: null,
              success: function(successCallback) {
                this.successCallback = successCallback;
                return this;
              },

              error: function(errorCallback) {
                this.errorCallback = errorCallback;
                return this;
              }
            };

            $timeout(function() {
              var contextVars = {
                'currentData': this.properties.rawData||this.properties.data||_self.active,
                'filter': this.properties.filter||"",
                'datasource': _self,
                'selectedIndex': _self.cursor,
                'index': _self.cursor,
                'selectedRow': _self.active,
                'item': _self.active,
                'selectedKeys': _self.getKeyValues(_self.active, true),
                'selectedKey': _self.getFirstKeyValue(_self.active, true),
                'callback': this.successCallback
              };

              var result;

              if (event) {
                result = _self.$scope.$eval(event, contextVars);
              } else {
                var args = [];

                var db = new PouchDB(_self.localDBName);

                if (this.verb == 'GET' && !this.properties.filter) {
                  db.allDocs({
                    include_docs: true,
                    attachments: true
                  }).catch(this.errorCallback).then(function(result) {
                    var data = [];
                    for (var i=0;i<result.rows.length;i++) {
                      data.push(result.rows[i].doc);
                    }
                    result.rows = data;
                    if (this.successCallback) {
                      this.successCallback(result);
                    }
                  }.bind(this));
                }

                else if (this.verb == 'GET') {
                  var filter = peg$parse(this.properties.filter);
                  db.find({selector: filter}).catch(this.errorCallback).then(function(result) {
                    result.rows = result.docs;
                    result.total_rows = result.rows.length;
                    if (this.successCallback) {
                      this.successCallback(result);
                    }
                  }.bind(this));
                }

                else if (this.verb == 'DELETE') {
                  db.remove(contextVars.currentData).catch(this.errorCallback).then(this.successCallback);
                }

                else if (this.verb == 'POST') {
                  db.post(contextVars.currentData).catch(this.errorCallback).then(function(result) {
                    contextVars.currentData._id = result.id;
                    contextVars.currentData._rev = result.rev;
                    if (this.successCallback) {
                      this.successCallback(contextVars.currentData);
                    }
                  }.bind(this));
                }

                else if (this.verb == 'PUT') {
                  db.put(contextVars.currentData).catch(this.errorCallback).then(function(result) {
                    contextVars.currentData._rev = result.rev;
                    if (this.successCallback) {
                      this.successCallback(contextVars.currentData);
                    }
                  }.bind(this));
                }
              }

              if (result) {
                this.successCallback(result);
              }

            }.bind(promise),0);

            return promise;
          }

        }

        return $http;
      }

      /**
       * Check if the datasource is waiting for any request response
       */
      this.isBusy = function() {
        return this.busy;
      }

      /**
       * Check if the datasource was loaded by service
       */
      this.isLoaded = function() {
        return this.loaded;
      }

      this.toString = function() {
        return "[Datasource]"
      }

      this.handleAfterCallBack = function(callBackFunction, callback) {
        if (callBackFunction) {
          try {

            var contextVars = {
              'currentData': this.data,
              'datasource': this,
              'selectedIndex': this.cursor,
              'index': this.cursor,
              'selectedRow': this.active,
              'item': this.active,
              'selectedKeys': this.getKeyValues(this.active, true),
              'selectedKey': this.getFirstKeyValue(_self.active, true),
              'callback': callback
            };

            this.$scope.$eval(callBackFunction, contextVars);
          } catch (e) {
            this.handleError(e);
          }
        }
      }

      this.handleBeforeCallBack = function(callBackFunction, callback) {
        var isValid = true;
        if (callBackFunction) {
          try {
            var contextVars = {
              'currentData': this.data,
              'datasource': this,
              'selectedIndex': this.cursor,
              'index': this.cursor,
              'selectedRow': this.active,
              'item': this.active,
              'selectedKeys': this.getKeyValues(this.active, true),
              'selectedKey': this.getFirstKeyValue(_self.active, true),
              'callback': callback
            };

            this.$scope.$eval(callBackFunction, contextVars);
          } catch (e) {
            isValid = false;
            this.handleError(e);
          }
        }
        return isValid;
      }

      /**
       * Error Handler function
       */
      this.handleError = function(data) {
        console.log(data);

        var error = "";

        if (data) {
          if (Object.prototype.toString.call(data) === "[object String]") {
            error = data;
          } else {
            var errorMsg = (data.msg || data.desc || data.message || data.error || data.responseText);
            if (this.isOData()) {
              errorMsg = data.error.message.value;
            }
            if (errorMsg) {
              error = errorMsg;
            }
          }
        }

        if (!error) {
          error = this.defaultNotSpecifiedErrorMessage;
        }

        var regex = /<h1>(.*)<\/h1>/gmi;
        result = regex.exec(error);

        if (result && result.length >= 2) {
          error = result[1];
        }

        this.errorMessage = error;

        if (this.onError && this.onError != '') {
          if (typeof(this.onError) === 'string') {
            try {
              var indexFunc = this.onError.indexOf('(') == -1 ? this.onError.length : this.onError.indexOf('(');
              var func = eval(this.onError.substring(0, indexFunc));
              if (typeof(func) === 'function') {
                this.onError = func;
              }
            } catch (e) {
              isValid = false;
              Notification.error(e);
            }
          }
        } else {
          this.onError = function(error) {
            Notification.error(error);
          };
        }

        this.onError.call(this, error);
      }

      // Start watching for changes in activeRow to notify observers
      if (this.observers && this.observers.length > 0) {
        $rootScope.$watch(function() {
          return this.active;
        }.bind(this), function(activeRow) {
          if (activeRow) {
            this.notifyObservers(activeRow);
          }
        }.bind(this), true);
      }
    }

    //Public methods

    this.setFile = function($file, object, field) {
      if ($file && $file.$error === 'pattern') {
        return;
      }
      if ($file) {
        toBase64($file, function(base64Data) {
          this.$apply = function(value) {
            object[field] = value;
            scope.$apply(object);
          }.bind(scope);
          this.$apply(base64Data);
        });
      }
    };

    this.downloadFile = function(field, keys) {
      if (keys === undefined)
        return;
      var url = (window.hostApp || "") + this.entity + "/download/" + field;
      for (var index = 0; index < keys.length; index++) {
        url += "/" + keys[index];
      }
      var req = {
        url: url,
        method: 'GET',
        responseType: 'arraybuffer'
      };
      $http(req).then(function(result) {
        var blob = new Blob([result.data], {
          type: 'application/*'
        });
        $window.open(URL.createObjectURL(blob));
      });
    };

    function toBase64(file, cb) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function(e) {
        var base64Data = e.target.result.substr(e.target.result.indexOf('base64,') + 'base64,'.length);
        cb(base64Data);
      };
    }

    this.openImage = function(data) {
      if (data.indexOf('https://') == -1 && data.indexOf('http://') == -1)  {
        var  value = 'data:image/png;base64,' + data;
        var w = $window.open("", '_blank', 'height=300,width=400');
        w.document.write('<img src="'+ value + '"/>');
      } else {
        $window.open(data, '_blank', 'height=300,width=400');
      }
    };

    this.byteSize = function(base64String) {
      if (!angular.isString(base64String)) {
        return '';
      }

      function endsWith(suffix, str) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      }

      function paddingSize(base64String) {
        if (endsWith('==', base64String)) {
          return 2;
        }
        if (endsWith('=', base64String)) {
          return 1;
        }
        return 0;
      }

      function size(base64String) {
        return base64String.length / 4 * 3 - paddingSize(base64String);
      }

      function formatAsBytes(size) {
        return size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' bytes';
      }

      return formatAsBytes(size(base64String));
    };

    function uuid() {
      var uuid = "", i, random;
      for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;

        if (i == 8 || i == 12 || i == 16 || i == 20) {
          uuid += "-"
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
      }
      return uuid;
    }

    /**
     * Append a new value to the end of this dataset.
     */
    this.insert = function(obj, onSuccess, onError, forceSave) {
      if (this.handleBeforeCallBack(this.onBeforeCreate)) {
        //Check if contains dependentBy, if contains, only store in data TRM
        if ((this.dependentLazyPost || this.batchPost) && !forceSave) {
          obj.__status = 'inserted';
          if (this.dependentLazyPost) {
            obj.__parentId = eval(this.dependentLazyPost).active.__$id;
          }
          this.hasMemoryData = true;
          this.notifyPendingChanges(this.hasMemoryData);

          if (onSuccess)
            onSuccess(obj);

        } else {
          service.save(obj).$promise.error(onError).then(onSuccess);
        }
      }
    };

    //Public methods

    /**
     * Append a datasource to be notify when has a post or cancel
     */
    this.addDependentDatasource = function(dts) {
      if (!this.children)
        this.children = [];

      this.children.push(dts);

      if (this.dependentLazyPost) {
        eval(this.dependentLazyPost).addDependentDatasource(dts);
      } else {
        if (!this.dependentData)
          this.dependentData = [];
        this.dependentData.push(dts);
      }
    }

    this.updateObjectAtIndex = function(obj, data, idx) {
      data = data || this.data;

      this.copy(obj, data[idx]);
      obj.__$id = data[idx].__$id;
      delete data[idx].__status;
      delete data[idx].__original;
      delete data[idx].__originalIdx;
      delete data[idx].__odatafiles;
    }

    this.cleanDependentBuffer = function() {
      var newData = [];
      $(this.data).each(function() {
        if (this.__status) {
          if (this.__status == "updated") {
            newData.push(this.__original);
          }
        } else {
          newData.push(this);
        }
      });

      this.data.length = 0;

      for (var i=0;i<newData.length;i++) {
        delete newData[i].__status;
        delete newData[i].__original;
        delete newData[i].__originalIdx;
        this.data.push(newData[i]);
      }

      if (this.postDeleteData) {
        for (var i=0;i<this.postDeleteData.length;i++) {
          delete this.postDeleteData[i].__status;
          delete this.postDeleteData[i].__original;
          delete this.postDeleteData[i].__originalIdx;
          this.data.push(this.postDeleteData[i]);
        }
      }

      if (this.data && this.data.length > 0) {
        this.cursor = 0;
        this.active = this.data[0];
      } else {
        this.cursor = -1;
        this.active = null;
      }

      this.busy = false;
      this.editing = false;
      this.inserting = false;
      this.postDeleteData = null;
      this.hasMemoryData = false;
      this.notifyPendingChanges(this.hasMemoryData);

      if (this.events.read) {
        this.callDataSourceEvents('read', this.data);
      }

      if (this.events.afterchanges) {
        this.callDataSourceEvents('afterchanges', this.data);
      }
    }

    this.cancelBatchData = function(callback) {
      if (this.dependentData) {
        $(reverseArr(this.dependentData)).each(function() {
          this.cleanDependentBuffer();
        });
      }

      this.cleanDependentBuffer();
      if (callback) {
        callback();
      }
    }

    this.flushDependencies = function(callback) {
      if (this.dependentData) {

        var ins = function() {

          reduce(this.dependentData, function (item, resolve) {
            item.storeDependentBuffer(function () {
              resolve();
            });
          }.bind(this), function () {
            if (callback) {
              callback();
            }
          }.bind(this))

        }.bind(this);

        reduce(reverseArr(this.dependentData), function (item, resolve) {
          item.storeDependentBuffer(function () {
            resolve();
          }, true);
        }.bind(this), function () {
          ins();
        }.bind(this))


      } else {
        if (callback) {
          callback();
        }
      }
    }

    this.postBatchData = function(callback) {
      this.postingBatch = true;
      var cleanFuncs = [];
      var func = function() {
        cleanFuncs.push(this.storeDependentBuffer(function () {
          reduce(this.dependentData, function (item, resolve) {
            cleanFuncs.push(item.storeDependentBuffer(function () {
              resolve();
            }));
          }.bind(this), function () {
            this.postingBatch = false;
            for (var x=0;x<cleanFuncs.length;x++) {
              cleanFuncs[x]();
            }
            if (callback) {
              callback();
            }
          }.bind(this))
        }.bind(this)));
      }.bind(this);

      //Primeiro executa as remoções
      reduce(reverseArr(this.dependentData), function (item, resolve) {
        item.storeDependentBuffer(function () {
          resolve();
        }, true);
      }.bind(this), function() {
        func();
      }.bind(this));
    }

    var reduce = function (array, func, callback) {
      if (!array || array.length == 0) {
        callback();
      } else {
        var requests = array.reduce(function (promiseChain, item) {

          return promiseChain.then(function () {
            return new Promise(function (resolve) {
              func(item, resolve);
            })
          });
        }, Promise.resolve());

        requests.then(function () {
          callback();
        });
      }
    }

    this.storeDependentBuffer = function(callback, onlyRemove) {
      var _self = this;
      var dependentDS = eval(_self.dependentLazyPost);

      if (this.batchPost) {
        dependentDS = this;
      }

      var array = [];

      if (!onlyRemove) {
        array = array.concat(_self.data);

        if (_self.memoryData) {
          for (key in _self.memoryData) {
            if (_self.memoryData.hasOwnProperty(key)) {
              var mem = _self.memoryData[key];
              for (var x = 0; x < mem.data.length; x++) {
                mem.data[x].__fromMemory = true;
              }
              array = array.concat(mem.data);
            }
          }
        }
      }

      if (_self.postDeleteData) {
        array = array.concat(_self.postDeleteData);
      }


      var func = function (item, resolve) {

        if (item.__status) {

          if (!_self.parameters) {
            if (_self.dependentLazyPostField) {
              item[_self.dependentLazyPostField] = dependentDS.active;
            }

            if (_self.entity.indexOf('//') > -1) {
              var keyObj = dependentDS.getKeyValues(dependentDS.active);
              var suffixPath = '';
              for (var key in keyObj) {
                if (keyObj.hasOwnProperty(key)) {
                  suffixPath += '/' + keyObj[key];
                }
              }
              suffixPath += '/';
              _self.entity = _self.entity.replace('//', suffixPath);
            }
          }

          if (_self.parameters) {
            var params = _self.getParametersMap(item.__parentId?item.__parentId:null);
            for (var key in params) {
              if (params.hasOwnProperty(key)) {
                updateObjectValue(item, key, params[key]);
              }
            }
          }

          if (item.__status == "inserted") {
            (function (oldObj) {
              var odataFiles = _self.processODataFiles(oldObj);
              _self.insert(oldObj, function (newObj) {
                var sender = oldObj.__sender;
                var idx = _self.getIndexOfListTempBuffer(oldObj, array);
                var isFromMemory = false;
                var currentObj = newObj;
                if (idx >= 0) {
                  currentObj = array[idx];
                  isFromMemory = array[idx].__fromMemory;
                  _self.updateObjectAtIndex(newObj, array, idx);
                }
                if (_self.events.create && !isFromMemory) {
                  if (sender) {
                    newObj = array[idx];
                    newObj.__sender = sender;
                  }
                  _self.callDataSourceEvents('create', newObj);
                  delete newObj.__sender;
                }

                if (odataFiles && odataFiles.length > 0) {
                  _self.sendODataFiles(odataFiles, newObj, function (result) {
                    currentObj[result.field] = result.data[result.field];
                  }, function() {
                    resolve();
                  });
                } else {
                  resolve();
                }
              }, function () {
                resolve();
              }, true);
            })(item);
          }

          else if (item.__status == "updated") {
            (function (oldObj) {
              var odataFiles = _self.processODataFiles(oldObj);
              _self.update(oldObj, function (newObj) {
                var sender = oldObj.__sender;
                var idx = _self.getIndexOfListTempBuffer(oldObj, array);
                var isFromMemory = false;
                var currentObj = newObj;
                if (idx >= 0) {
                  currentObj = array[idx];
                  isFromMemory = array[idx].__fromMemory;
                  _self.updateObjectAtIndex(newObj, array, idx);
                  newObj = array[idx];
                }
                if (_self.events.update && !isFromMemory) {
                  if (sender) {
                    newObj.__sender = sender;
                  }
                  _self.callDataSourceEvents('update', newObj);
                  delete newObj.__sender;
                }
                if (odataFiles && odataFiles.length > 0) {
                  _self.sendODataFiles(odataFiles, newObj, function (result) {
                    currentObj[result.field] = result.data[result.field];
                  }, function() {
                    resolve();
                  });
                } else {
                  resolve();
                }
              }, function () {
                resolve();
              }, true);
            })(item);
          }

          else if (item.__status == "deleted") {
            (function (oldObj) {
              _self.remove(oldObj, function () {
                if (_self.events.delete) {
                  var param = {};
                  _self.copy(oldObj, param);
                  delete param.__status;
                  delete param.__original;
                  delete param.__originalIdx;
                  _self.callDataSourceEvents('delete', param);
                }
                resolve();
              }, true, null, function() {
                resolve();
              });
            })(item);
          }

          else {
            resolve();
          }
        } else {
          resolve();
        }
      };

      var resetFunc = function() {
        if (!onlyRemove) {
          this.busy = false;
          this.editing = false;
          this.inserting = false;
          this.hasMemoryData = false;
          this.memoryData = null;
          this.notifyPendingChanges(this.hasMemoryData);
          if (this.events.afterchanges) {
            this.callDataSourceEvents('afterchanges', this.data);
          }
        }
      }.bind(this);

      reduce(array, func, function () {
        if (callback) {
          callback();
        }
        this.postDeleteData = null;
      }.bind(this));

      return resetFunc;
    }

    /**
     * Find object in list by tempBufferId
     */
    this.getIndexOfListTempBuffer = function(obj, data) {
      data = data || this.data;
      for (var i = 0; i < data.length; i++) {
        if (data[i].__$id && obj.__$id && data[i].__$id == obj.__$id) {
          return i;
        }
      }
      return -1;
    }

    this.getObjectAsString = function(o) {
      if (this.isOData()) {
        return window.objToOData(o);
      } else {
        if (o == null) {
          return "";
        }
        else if (typeof o == 'number') {
          return o+"@@number";
        }
        else if (o instanceof Date) {
          return o.toISOString()+"@@datetime";
        }

        else if (typeof o == 'boolean') {
          return o+"@@boolean";
        }

        return o+"";
      }
    }

    /**
     * Uptade a value into this dataset by using the dataset key to compare the objects.
     */
    this.update = function(obj, onSuccess, onError, forceUpdate) {

      if (this.handleBeforeCallBack(this.onBeforeUpdate)) {
        if ((this.dependentLazyPost || this.batchPost) && !forceUpdate) {
          if (onSuccess)
            onSuccess(obj);
        } else {
          service.update(this.getEditionURL(obj, forceUpdate), obj).$promise.error(onError).then(onSuccess);
        }
      }
    };

    this.validateFields = function(expression, message) {
      var selection = $(expression);
      if (selection.length > 0) {
        var forId = $('label[for="'+selection.get(0).id+'"]');
        var label = selection.get(0).id
        if (forId.length > 0) {
          label = forId.text();
        }

        Notification.error(message.replace("{0}", label));
        $(selection.get(0)).addClass("ng-touched").removeClass("ng-untouched");
        if (selection.get(0).focus) {
          selection.get(0).focus();
        }
        return false;
      }
      return true;
    }

    /**
     * Always valid if input has pattern
     */

    this.getPatterns = function(){
      return $('input[ng-model*="' + this.name + '."]').filter(function( index ) {
        return $( this ).attr("pattern");
      });
    };

    /**
     * Valid if required field is valid
     */
    this.missingRequiredField = function() {
      if(this.getPatterns().length > 0){
        return false;
      }
      if (this.checkRequired) {
        var valid = this.validateFields('[required][ng-model*="' + this.name + '."].ng-invalid-required', this.translate.instant("FieldIsRequired"));
        valid = valid && this.validateFields('[required][ng-model*="' + this.name + '."].ng-empty', this.translate.instant("FieldIsRequired"));
        valid = valid && this.validateFields('[valid][ng-model*="' + this.name + '."].ng-empty', this.translate.instant("FieldIsRequired"));
        valid = valid && this.validateFields('[ng-model*="' + this.name + '."].ng-invalid', this.translate.instant("FieldIsInvalid"));

        return !valid;
      } else {
        return false;
      }
    };

    /**
     * Valid is other validations like email, date and so on
     */
    this.hasInvalidField = function() {
      if(this.getPatterns().length > 0){
        return false;
      }
      if (this.checkRequired) {
        return $('input[ng-model*="' + this.name + '."]:invalid').size() > 0;
      } else {
        return false;
      }
    };

    this.postSilent = function(onSuccess, onError) {
      this.post(onSuccess, onError, true);
    }

    this.updateActive = function(from) {
      for (var key in from) {
        if (from.hasOwnProperty(key)) {
          this.active[key] = from[key];
        }
      }
    }

    this.processODataFiles = function(array) {
      var odataFile = [];

      for (var key in array) {
        if (key.indexOf('__odataFile_') > -1) {

          var odataFileObj = {
            field: key.replace('__odataFile_',''),
            value: array[key]
          }
          odataFile.push(odataFileObj);
          array[odataFileObj.field] = undefined;
          delete array[key];
        }
      }

      return odataFile;
    };

    this.sendODataFiles = function(odataFile, obj, callback, afterUpdate) {
      if (obj && odataFile && odataFile.length > 0) {

        var url = this.entity;
        var keysValues = this.getKeyValues(obj);
        var keysFilter = ['('];
        var idx = 0;
        for (var k in keysValues) {
          if (idx > 0)
            keysFilter.push(',')
          keysFilter.push(k);
          keysFilter.push('=');
          keysFilter.push(window.objToOData(keysValues[k]));
          idx++;
        }
        keysFilter.push(')');
        url += keysFilter.join('');

        var _u = JSON.parse(localStorage.getItem('_u'));

        reduce(odataFile, function (of, resolve) {

          var file = of.value;
          var xhr = new XMLHttpRequest;
          xhr.open('PUT', (window.hostApp || "") + url + '/' +  of.field + '/$value');
          xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          xhr.setRequestHeader('X-File-Name', file.name);
          xhr.setRequestHeader('Content-Type', (file.type||'application/octet-stream') + ';charset=UTF-8' );
          xhr.setRequestHeader('X-AUTH-TOKEN', _u.token);

          xhr.onreadystatechange = function(){
            if(xhr.readyState === 4 && xhr.status === 201){
              //Having to make another request to get the base64 value
              service.call(url + '/' +  of.field, 'GET', {}, false).$promise.error(function(errorMsg) {
                Notification.error('Error send file');
              }).then(function(data, resultBool) {
                if (callback) {
                  callback({ field: of.field, data: data });
                } else {
                  obj[of.field] = data[of.field];
                }

                resolve();
              });
            }
          };

          xhr.send(file);

        }.bind(this), function() {
          if (afterUpdate) {
            afterUpdate();
          }
        }.bind(this));
      } else {
        if (afterUpdate) {
          afterUpdate();
        }
      }
    };

    this.getFieldSchema = function(fieldName) {
      var s;
      if (this.schema) {
        for (var i = 0; i < this.schema.length; i++) {
          if (this.schema[i].name == fieldName) {
            s = this.schema[i];
            break;
          }
        }
      }
      return s;
    };

    /**
     * Insert or update based on the the datasource state
     */
    this.post = function(onSuccess, onError, silent) {

      if (!silent && this.missingRequiredField())
        return;

      if (!silent && this.hasInvalidField())
        return;

      this.lastAction = "post"; //TRM

      this.busy = true;

      if (this.inserting) {
        // Make a new request to persist the new item
        this.insert(this.active, function(obj, hotData) {
          // In case of success add the new inserted value at
          // the end of the array

          if (this.active.__sender) {
            obj.__sender = this.active.__sender;
          }

          if (this.active.__$id) {
            obj.__$id = this.active.__$id;
          }

          var func = function() {
            // The new object is now the active
            this.active = obj;

            this.handleAfterCallBack(this.onAfterCreate);
            this.onBackNomalState();

            if (onSuccess) {
              onSuccess(this.active);
            }

            if (this.events.create && hotData) {
              this.callDataSourceEvents('create', this.active);
              delete _self.active.__sender;
            }

            if (this.events.memorycreate && !hotData) {
              this.callDataSourceEvents('memorycreate', this.active);
            }
          }.bind(this);

          var proceed = function () {
            this.data.push(obj);

            if (this.dependentData && !this.dependentLazyPost && !this.batchPost) {
              this.flushDependencies(func);
            } else {
              func();
            }
          }.bind(this);

          if (!hotData) {
            proceed();
          } else {
            var odataFiles = this.processODataFiles(this.active);

            if (odataFiles && odataFiles.length > 0) {
              this.sendODataFiles(odataFiles, obj, function (result) {
                obj[result.field] = result.data[result.field];
              }.bind(this), function() {
                proceed()
              }.bind(this));
            } else {
              proceed();
            }
          }
        }.bind(this), onError);

      } else if (this.editing) {
        // Make a new request to update the modified item
        this.update(this.active, function(obj, hotData) {

          var odataFiles;

          if (hotData) {
            odataFiles = this.processODataFiles(this.active);
          }

          var foundRow;
          // Get the list of keys
          var keyObj = this.getKeyValues(this.lastActive);

          // For each row data
          this.data.forEach(function(currentRow) {
            // Iterate all keys checking if the
            // current object match with the
            // extracted key values
            var found;

            if (this.lastActive.__$id && currentRow.__$id) {
              found = this.lastActive.__$id == currentRow.__$id;
            } else {
              var dataKeys = this.getKeyValues(currentRow);
              for (var key in keyObj) {
                if (dataKeys[key] && dataKeys[key] === keyObj[key]) {
                  found = true;
                } else {
                  found = false;
                  break;
                }
              }
            }

            if (found) {
              foundRow = currentRow;
              var lastActive = {};
              this.copy(this.lastActive, lastActive);
              this.copy(obj, currentRow);

              if (this.lastActive && this.lastActive.__sender) {
                currentRow .__sender = this.lastActive.__sender;
              }

              this.active = currentRow;
              if ((this.dependentLazyPost || this.batchPost) && !currentRow.__status) {
                currentRow.__status = "updated";
                currentRow.__original = lastActive;
                this.hasMemoryData = true;
                if (this.dependentLazyPost) {
                  currentRow.__parentId = eval(this.dependentLazyPost).active.__$id;
                }
              }
              this.notifyPendingChanges(this.hasMemoryData);
              this.handleAfterCallBack(this.onAfterUpdate);

              if (this.events.update && hotData) {
                this.callDataSourceEvents('update', this.active);
                delete this.active.__sender;
              }

              if (this.events.memoryupdate && !hotData) {
                this.callDataSourceEvents('memoryupdate', this.active);
              }
            }
          }.bind(this));

          var back = function() {
            this.onBackNomalState();

            if (onSuccess) {
              onSuccess(this.active);
            }
          }.bind(this);

          var func = function() {
            if (!hotData) {
              back();
            } else {
              if (odataFiles && odataFiles.length > 0) {
                this.sendODataFiles(odataFiles, foundRow, function (result) {
                  foundRow[result.field] = result.data[result.field];
                }.bind(this), function() {
                  if (this.events.update && hotData) {
                    this.callDataSourceEvents('update', foundRow);
                  }
                  back();
                }.bind(this));
              } else {
                back();
              }
            }
          }.bind(this);

          if (this.dependentData && !this.dependentLazyPost && !this.batchPost) {
            this.flushDependencies(func);
          } else {
            func();
          }
        }.bind(this), onError);
      } else {
        if (this.data.length == 0) {
          this.startInserting(this.active, function() {
            this.post(onSuccess, onError, silent);
          }.bind(this));
        } else {
          this.startEditing(null, function() {
            this.post(onSuccess, onError, silent);
          }.bind(this));
        }
      }
    };

    this.notifyPendingChanges = function(value) {
      console.log("notifyPendingChanges : " + value);
      if (this.events.pendingchanges) {
        this.callDataSourceEvents('pendingchanges', value);
      }

      if (this.dependentLazyPost) {
        eval(this.dependentLazyPost).notifyPendingChanges(value);
      }
    }

    this.getDeletionURL = function(obj, forceOriginalKeys) {
      var keyObj = this.getKeyValues(obj.__original?obj.__original:obj, forceOriginalKeys);

      var suffixPath = "";
      if (this.isOData()) {
        suffixPath = "(";
      }
      var count = 0;
      for (var key in keyObj) {
        if (keyObj.hasOwnProperty(key)) {
          if (this.isOData()) {
            if (count > 0) {
              suffixPath += ",";
            }
            suffixPath += key + "=" + this.getObjectAsString(keyObj[key]);
          } else {
            suffixPath += "/" + keyObj[key];
          }
          count++;
        }
      }
      if (this.isOData()) {
        suffixPath += ")";
      }

      var url = this.entity;

      if (this.entity.endsWith('/')) {
        url = url.substring(0, url.length-1);
      }

      return url + suffixPath;
    };

    this.notifyPendingChanges = function(value) {
      console.log("notifyPendingChanges : " + value);
      if (this.events.pendingchanges) {
        this.callDataSourceEvents('pendingchanges', value);
      }

      if (this.dependentLazyPost) {
        eval(this.dependentLazyPost).notifyPendingChanges(value);
      }
    }

    this.getDeletionURL = function(obj, forceOriginalKeys) {
      var keyObj = this.getKeyValues(obj.__original?obj.__original:obj, forceOriginalKeys);

      var suffixPath = "";
      if (this.isOData()) {
        suffixPath = "(";
      }
      var count = 0;
      for (var key in keyObj) {
        if (keyObj.hasOwnProperty(key)) {
          if (this.isOData()) {
            if (count > 0) {
              suffixPath += ",";
            }
            suffixPath += key + "=" + this.getObjectAsString(keyObj[key]);
          } else {
            suffixPath += "/" + keyObj[key];
          }
          count++;
        }
      }
      if (this.isOData()) {
        suffixPath += ")";
      }

      var url = this.entity;

      if (this.entity.endsWith('/')) {
        url = url.substring(0, url.length-1);
      }

      return url + suffixPath;
    }

    this.getEditionURL = function(obj, forceOriginalKeys) {
      var keyObj = this.getKeyValues(obj.__original?obj.__original:obj, forceOriginalKeys);

      var suffixPath = "";
      if (this.isOData()) {
        suffixPath = "(";
      }
      for (var key in keyObj) {
        if (keyObj.hasOwnProperty(key)) {
          if (this.isOData()) {
            suffixPath += ((suffixPath == "(")?'':',')  + key + "=" + this.getObjectAsString(keyObj[key]);
          } else {
            suffixPath += "/" + keyObj[key];
          }
        }
      }
      if (this.isOData()) {
        suffixPath += ")";
      }

      var url = this.entity;

      if (this.entity.endsWith('/')) {
        url = url.substring(0, url.length-1);
      }

      return url + suffixPath;
    }


    this.refreshActive = function(onSuccess, onError) {
      if (this.active && this.active.__status != 'inserted') {
        var url = this.getEditionURL(this.active);
        var keyObj = this.getKeyValues(this.active);

        this.$promise = this.getService("GET")({
          method: "GET",
          url: url,
          headers: this.headers
        }).success(function(rows, status, headers, config) {
          var row = null;

          if (this.isOData()) {
            row = rows.d;
            this.normalizeObject(row);
          } else {
            if (rows && rows.length > 0)
              row = rows[0];
          }

          var indexFound = -1;
          var i = 0;
          this.data.forEach(function(currentRow) {
            var found = false;
            var idsFound = 0;
            var idsTotal = 0;
            for (var key in keyObj) {
              idsTotal++;
              if (currentRow[key] && currentRow[key] === keyObj[key]) {
                idsFound++;
              }
            }
            if (idsFound == idsTotal)
              found = true;

            if (found) {
              indexFound = i;
              if (row) {
                this.copy(row, currentRow);
                this.copy(row, this.active);
              }
            }
            i++;
          }.bind(this));

          //Atualizou e o registro deixou de existir, remove da lista
          if (indexFound != -1) {
            if (this.events.update) {
              this.callDataSourceEvents('update', this.active);
            }

            if (onSuccess) {
              onSuccess(this.active)
            }
          } else {
            if (onError) {
              onError();
            }
          }
        }.bind(this)).error(function(data, status, headers, config) {
          if (onError) {
            onError();
          }
        }.bind(this));
      } else {
        if (onSuccess) {
          onSuccess(this.active)
        }
      }
    };

    this.buildURL = function(keyValues) {
      var keyObj = this.getKeyValues(this.active);
      if (typeof keyValues !== 'object') {
        keyValues = [keyValues];
      }

      var params = "";
      var count = 0;
      for (var key in keyObj) {
        if (keyObj.hasOwnProperty(key)) {
          var value;

          if (Array.isArray(keyValues)) {
            value = keyValues[count];
          } else {
            value = keyValues[key];
          }

          if (count > 0) {
            params += " and ";
          }
          params += key + " eq " + this.getObjectAsString(value);
        }

        count++;
      }

      return params;
    }

    this.findObj = function(keyObj, multiple, onSuccess, onError) {

      var keys = this.keys;

      for (var i = 0; i < this.data.length; i++) {

        var found = false;
        var item = this.data[i];
        for (var j=0;j<keys.length;j++) {
          if (keyObj[j] == item[keys[j]])
            found = true;
          else
            found = false;
        }

        if (found) {
          if (onSuccess) {
            onSuccess(this.data[i]);
          }
          return;
        }
      }


      var terms = this.buildURL(keyObj);

      var filterData;

      filterData = {
        params: {
          $filter: terms
        }
      }

      if (terms == null || terms.length == 0) {
        filterData = {}
      }

      this.fetch(filterData, {
        success: function(data) {
          if (onSuccess) {
            onSuccess(data.length?data[0]:null);
          }
        },
        error: function(error) {
          if (onError) {
            onError();
          }
        }
      }, undefined, {lookup: true});
    }

    this.getColumn = function(index) {
      var returnValue = [];
      $.each(this.data, function(key, value) {
        returnValue.push(value[index]);
      });
      return returnValue;
    };

    // Set this datasource back to the normal state
    this.onBackNomalState = function() {
      this.$scope.safeApply(function() {
        this.busy = false;
        this.editing = false;
        this.inserting = false;
      }.bind(this))
    };

    /**
     * Cancel the editing or inserting state
     */
    this.cancel = function() {
      if (this.inserting) {
        if (this.cursor >= 0)
          this.active = this.data[this.cursor];
        else
          this.active = {};
      }
      if (this.editing) {
        this.active = this.lastActive;
      }
      this.onBackNomalState();
      this.lastAction = "cancel"; //TRM
      if (this.dependentData) {
        $(this.dependentData).each(function() {
          this.cleanDependentBuffer();
        });
      }
    };

    this.removeODataFields = function(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] && obj[key].__deferred) {
            delete obj[key];
          }
        }
      }

      return obj;
    }


    this.retrieveDefaultValues = function(obj, callback) {
      if (this.isEventData() || this.isLocalData()) {
        this.$scope.safeApply(function() {

          this.active = {};
          if (this.isLocalData()) {
            this.active[this.keys[0]] =  this.uuidv4();
          }
          this.updateWithParams();
          if (callback) {
            callback();
          }
        }.bind(this))
      } else if (obj) {
        this.active = obj||{};
        this.updateWithParams();
        if (callback) {
          callback();
        }
      } else {
        if (this.entity.indexOf('cronapi') >= 0 || this.isOData()) {
          // Get an ajax promise
          var url = this.entity;
          url += (this.entity.endsWith('/')) ? '__new__' : '/__new__';
          this.$promise = $http({
            method: "GET",
            url: this.removeSlash((window.hostApp || "") + url),
            headers: this.headers
          }).success(function (data, status, headers, config) {
            if (this.isOData()) {
              this.active = this.removeODataFields(data.d);
              this.normalizeData(this.active)
            } else {
              this.active = data;
            }
            this.updateWithParams();
            if (callback) {
              callback();
            }
          }.bind(this)).error(function (data, status, headers, config) {
            this.active = {};
            this.updateWithParams();
            if (callback) {
              callback();
            }
          }.bind(this));
        } else {
          this.active = {};
          this.updateWithParams();
          if (callback) {
            callback();
          }
        }
      }
    };

    var updateObjectValue = function(obj, key, value) {
      var parts = key.split(".")
      for (var i=0;i<parts.length;i++) {
        var keyPart = parts[i];
        if (i == parts.length - 1) {
          obj[keyPart] = value;
        } else {
          if (obj[keyPart] === undefined || obj[keyPart] == null) {
            obj[keyPart] = {};
          }

          obj = obj[keyPart];
        }
      }
    }


    this.updateWithParams = function() {
      if (this.parameters) {
        var params = this.getParametersMap();
        for (var key in params) {
          if (params.hasOwnProperty(key)) {
            updateObjectValue(this.active, key, params[key]);
          }
        }
      }
    }

    /**
     * Put the datasource into the inserting state
     */
    this.startInserting = function(item, callback) {
      this.retrieveDefaultValues(item, function() {
        if (!this.active.__$id) {
          this.active.__$id = uuid();
        }

        this.inserting = true;

        if (this.onStartInserting) {
          this.onStartInserting();
        }

        if (callback) {
          callback(this.active);
        }
        if (this.events.creating) {
          this.callDataSourceEvents('creating', this.active);
        }
      }.bind(this));
    };

    /**
     * Put the datasource into the editing state
     */
    this.startEditing = function(item, callback) {
      if (item) {
        this.active = this.copy(item);
        this.lastActive = item;
      } else {
        if (this.data.length == 0) {
          this.startInserting(null, callback);
          return;
        }
        this.lastActive = this.active;
        this.active = this.copy(this.active);
      }
      this.editing = true;
      if (callback) {
        callback(this.active);
      }
      if (this.events.editing) {
        this.callDataSourceEvents('updating', this.active);
      }
    };

    this.removeSilent = function(object, onSuccess, onError) {
      this.remove(object, null, false, onSuccess, onError, true);
    }

    /**
     * Remove an object from this dataset by using the given id.
     * the objects
     */
    this.remove = function(object, callback, forceDelete, onSuccess, onError, silent) {

      this.busy = true;

      var _remove = function(object, callback) {
        if (!object) {
          object = this.active;
        }

        var keyObj = this.getKeyValues(object, forceDelete);

        callback = callback || function(empty, hotData) {
          // For each row data
          for (var i = 0; i < this.data.length; i++) {
            // current object match with the same
            var found;
            if (object.__$id && this.data[i].__$id) {
              found = this.data[i].__$id == object.__$id;
            } else {
              // vey values
              // Check all keys
              // Iterate all keys checking if the
              var dataKeys = this.getKeyValues(this.data[i]);
              for (var key in keyObj) {
                if (keyObj.hasOwnProperty(key)) {
                  if (dataKeys[key] && dataKeys[key] === keyObj[key]) {
                    found = true;
                  } else {
                    // There's a difference between the current object
                    // and the key values extracted from the object
                    // that we want to remove
                    found = false;
                    break;
                  }
                }
              }
            }

            if (found) {
              if (this.dependentLazyPost || this.batchPost) {
                if (this.data[i].__status != 'inserted') {
                  if (!this.postDeleteData) {
                    this.postDeleteData = [];
                  }
                  var deleted = this.data[i];
                  this.copy(this.data[i], deleted);
                  deleted.__status = 'deleted';
                  deleted.__originalIdx = i;
                  this.postDeleteData.push(deleted);
                  this.hasMemoryData = true;
                  this.notifyPendingChanges(this.hasMemoryData);

                  if (this.events.memorydelete) {
                    this.callDataSourceEvents('memorydelete', deleted);
                  }
                }
              }
              // If it's the object we're loking for
              // remove it from the array
              this.data.splice(i, 1);

              var newCursor = i - 1;

              if (newCursor < 0) {
                newCursor = 0;
              }

              if (newCursor > this.data.length - 1) {
                newCursor = this.data.length;
              }

              if (this.data[newCursor]) {
                this.active = this.data[newCursor];
                this.cursor = newCursor;
              } else {
                this.active = null;
                this.cursor = -1;
              }

              this.onBackNomalState();
              break;
            }
          }
          this.handleAfterCallBack(this.onAfterDelete);

          if (onSuccess) {
            onSuccess(object);
          }

          if (this.events.delete && hotData) {
            this.callDataSourceEvents('delete',object);
          }
        }.bind(this)

        if (this.handleBeforeCallBack(this.onBeforeDelete)) {
          if ((this.dependentLazyPost || this.batchPost) && !forceDelete) {
            callback();
          } else {
            service.remove(this.getDeletionURL(object, forceDelete)).$promise.error(onError).then(callback);
          }
        }
      }.bind(this);

      if (!forceDelete && !silent && this.deleteMessage && this.deleteMessage.length > 0) {
        if (confirm(this.deleteMessage)) {
          _remove(object, callback);
        } else {
          this.filter();
        }
      } else {
        _remove(object, callback);
      }
    };

    /**
     * Get the object keys values from the datasource keylist
     * PRIVATE FUNCTION
     */
    this.getKeyValues = function(rowData, forceOriginalKeys) {
      var keys = this.keys;

      var keyValues = {};
      for (var i = 0; i < this.keys.length; i++) {
        var key = this.keys[i];
        var rowKey = null;
        try {
          rowKey = eval("rowData."+key);
        } catch(e){
          //
        }
        keyValues[key] = rowKey;
      }

      return keyValues;
    }.bind(this);

    this.getFirstKeyValue = function(rowData, forceOriginalKeys) {
      var keys = this.keys;

      var keyValues = {};
      for (var i = 0; i < this.keys.length; i++) {
        var key = this.keys[i];
        var rowKey = null;
        try {
          rowKey = eval("rowData."+key);
        } catch(e){
          //
        }
        return rowKey;
      }

    }.bind(this);

    /**
     * Check if two objects are equals by comparing their keys PRIVATE FUNCTION.
     */
    this.objectIsEquals = function(object1, object2) {
      var keys1 = this.getKeyValues(object1);
      var keys2 = this.getKeyValues(object2);
      for (var key in keys1) {
        if (keys1.hasOwnProperty(key)) {
          if (!keys2.hasOwnProperty(key)) return false;
          if (keys1[key] !== keys2[key]) return false;
        }
      }
      return true;
    }

    /**
     * Check if the object has more itens to iterate
     */
    this.hasNext = function() {
      return this.data && (this.cursor < this.data.length - 1);
    };

    /**
     * Check if the cursor is not at the beginning of the datasource
     */
    this.hasPrevious = function() {
      return this.data && (this.cursor > 0);
    };

    /**
     * Check if the object has more itens to iterate
     */
    this.order = function(order) {
      this._savedProps.order = order;
    };

    /**
     * Get the values of the active row as an array.
     * This method will ignore any keys and only return the values
     */
    this.getActiveValues = function() {
      if (this.active && !this._activeValues) {
        $rootScope.$watch(function(scope) {
              return this.active;
            }.bind(this),
            function(newValue, oldValue) {
              this._activeValues = this.getRowValues(this.active);
            }.bind(this), true);
      }
      return this._activeValues;
    }

    this.__defineGetter__('activeValues', function() {
      return _self.getActiveValues();
    });

    /**
     * Get the values of the given row
     */
    this.getRowValues = function(rowData) {
      var arr = [];
      for (var i in rowData) {
        if (rowData.hasOwnProperty(i)) {
          arr.push(rowData[i]);
        }
      }
      return arr;
    }

    /**
     *  Get the current item moving the cursor to the next element
     */
    this.next = function() {
      if (!this.hasNext()) {
        this.nextPage();
      }
      this.active = this.copy(this.data[++this.cursor], {});
      return this.active;
    };

    /**
     *  Try to fetch the previous page
     */
    this.nextPage = function() {
      var resourceURL = (window.hostApp || "") + this.entity;

      if (!this.hasNextPage()) {
        return;
      }
      if (this.apiVersion == 1 || resourceURL.indexOf('/cronapi/') == -1) {
        this.offset = parseInt(this.offset) + parseInt(this.rowsPerPage);
      } else {
        this.offset = parseInt(this.offset) + 1;
      }
      this.fetch(this._savedProps, {
        success: function(data) {
          if (!data || data.length < parseInt(this.rowsPerPage)) {
            if (this.apiVersion == 1 || resourceURL.indexOf('/cronapi/') == -1) {
              this.offset = parseInt(this.offset) - this.data.length;
            }
          }
        }
      }, true);
    };

    /**
     *  Try to fetch the previous page
     */
    this.prevPage = function() {
      if (!this.append && !this.preppend) {
        this.offset = parseInt(this.offset) - this.data.length;

        if (this.offset < 0) {
          this.offset = 0;
        } else if (this.offset >= 0) {
          this.fetch(this._savedProps, {
            success: function(data) {
              if (!data || data.length === 0) {
                this.offset = 0;
              }
            }
          }, true);
        }
      }
    };

    /**
     *  Check if has more pages
     */
    this.hasNextPage = function() {
      return this.hasMoreResults && (this.rowsPerPage != -1);
    };

    /**
     *  Check if has previews pages
     */
    this.hasPrevPage = function() {
      return this.offset > 0 && !this.append && !this.prepend;
    };

    /**
     *  Get the previous item
     */
    this.previous = function() {
      if (!this.hasPrevious()) throw "Dataset Overflor Error";
      this.active = this.copy(this.data[--this.cursor], {});
      return this.active;
    };

    /**
     *  Moves the cursor to the specified item
     */
    this.goTo = function(rowId, serverQuery) {
      var found = false;

      if (rowId == null || rowId == undefined) {
        return null;
      }

      if (typeof rowId === 'object' && rowId !== null) {
        var dataKeys;
        if (this.data.length > 0) {
          dataKeys = this.getKeyValues(this.data[0]);
        }
        for (var i = 0; i < this.data.length; i++) {
          if (rowId.__$id && this.data[i].__$id) {
            found = rowId.__$id == this.data[i].__$id;
          } else {
            var item = this.data[i];
            for (var key in dataKeys) {
              if (rowId.hasOwnProperty(key) && rowId[key] === item[key])
                found = true;
              else
                found = false;
            }
          }
          if (found) {
            this.cursor = i;
            this.active = this.copy(this.data[this.cursor], {});

            var keys = this.getKeyValues(this.data[this.cursor]);
            var defined = true;
            for (var key in keys) {
              if (keys[key] === undefined) {
                defined= false;
                break;
              }
            }

            if (!defined) {
              this.fetchChildren();
            }

            return this.active;
          }
        }
      } else {
        if (Array.isArray(this.keys)) {
          for (var i = 0; i < this.data.length; i++) {
            if (this.data[i][this.keys[0]] === rowId) {
              this.cursor = i;
              this.active = this.copy(this.data[this.cursor], {});
              found = true
              return this.active;
            }
          }
        }
      }

      return null;
    };

    /**
     *  Get the current cursor index
     */
    this.getCursor = function() {
      return this.cursor;
    };

    /**
     *  filter dataset by URL
     */
    this.filter = function(url, callback) {
      var oldoffset = this.offset;
      this.offset = 0;
      this.fetch({
        path: url
      }, {
        beforeFill: function(oldData) {
          this.cleanup();
        },
        error: function(error) {
          this.offset = oldoffset;
        },
        success: function(data) {
          if (callback) {
            callback(data);
          }
        }
      });
    };

    this.doSearchAll = function(terms, caseInsensitive) {
      this.searchTimeout = null;
      var oldoffset = this.offset;
      this.offset = 0;
      this.fetch({
        params: {
          filter: "%"+terms+"%",
          filterCaseInsensitive: (caseInsensitive?true:false)
        }
      }, {
        beforeFill: function(oldData) {
          this.cleanup();
        },
        error: function(error) {
          this.offset = oldoffset;
        }
      });
    }

    this.searchAll = function(terms, caseInsensitive) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }

      this.searchTimeout = setTimeout(function() {
        this.doSearchAll(terms, caseInsensitive);
      }.bind(this), 500);
    };

    this.doSearch = function(terms, caseInsensitive) {
      this.searchTimeout = null;
      var oldoffset = this.offset;
      this.offset = 0;
      var filterData;
      if (this.isOData()) {
        filterData = {
          params: {
            $filter: terms
          }
        }

        if (terms == null || terms.length == 0) {
          filterData = {}
        }
      } else {
        filterData = {
          params: {
            filter: terms,
            filterCaseInsensitive: (caseInsensitive?true:false)
          }
        }
      }

      this.fetch(filterData, {
        beforeFill: function(oldData) {
          this.cleanup();
        },
        error: function(error) {
          this.offset = oldoffset;
        }
      });
    }

    this.search = function(terms, caseInsensitive) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }

      this.caseInsensitive = caseInsensitive;
      this.terms = terms;

      this.searchTimeout = setTimeout(function() {
        this.doSearch(terms, caseInsensitive);
      }.bind(this), 500);
    };

    /**
     *  refresh dataset by URL and queryParams,
     */
    this.refresh = function(query, url, minChar) {
      this.cleanup();
      if (minChar === undefined) {
        minChar = 0;
      }
      if (query.length >= minChar) {
        this.filter(url + "/" + query);
      }
    };

    /**
     * Cleanup datasource
     */
    this.cleanup = function(cleanOptions) {
      if (!cleanOptions) {
        cleanOptions = {};
      }
      this.offset = 0;
      this.rowsCount = -1;
      this.data.length = 0;
      if (!cleanOptions.ignoreAtive) {
        this.cursor = -1;
        this.active = {};
      }
      this.hasMoreResults = false;
    }

    /**
     *  Get the current row data
     */
    this.current = function() {
      return this.active || this.data[0];
    };

    this.getLink = function(rel) {
      if (this.links) {
        for (var i = 0; i < this.links.length; i++) {
          if (this.links[i].rel == rel) {
            return this.links[i].href;
          }
        }
      }
    }

    this.isOData = function() {
      return this.entity.indexOf('odata') > 0;
    }

    this.isEventData = function() {
      return this.onGET !== undefined && this.onGET !== null && this.onGET !== '';
    }

    this.isLocalData = function() {
      return this.entity.indexOf('local://') == 0;
    }

    this.normalizeValue = function(value, unquote) {
      if (unquote == null || unquote == undefined) {
        unquote = false;
      }
      return window.oDataToObj(value, unquote);
    }

    this.normalizeObject = function(data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var d = data[key];
          if (d) {
            if (typeof d == 'object') {
              this.normalizeObject(d);
            }

            else {
              data[key] = this.normalizeValue(d);
            }

          }
        }
      }
    }

    this.normalizeData = function(data) {
      if (data) {
        delete data.__metadata;
        for (var i = 0; i < data.length; i++) {
          this.normalizeObject(data[i]);
        }
      }
      return data;
    }

    this.getAllData = function() {
      var array = [];

      array = array.concat(this.data);

      if (this.memoryData) {
        for (key in this.memoryData) {
          if (this.memoryData.hasOwnProperty(key)) {
            var mem = this.memoryData[key];
            if (mem.data) {
              array = array.concat(mem.data);
            }
          }
        }
      }

      if (this.postDeleteData) {
        array = array.concat(this.postDeleteData);
      }

      return array;
    }

    this.getParametersMap = function(parentId) {
      var map = {};

      var parameters;

      var obj;

      var mapParams;

      if (parentId) {
        parameters = this.parametersExpression;
        var arr = eval(this.dependentLazyPost).getAllData();

        for (var i=0;i<arr.length;i++) {
          if (arr[i].__$id == parentId) {
            obj = arr[i];
            break;
          }
        }

        mapParams = this.getParametersMap();
      } else {
        parameters =  this.parameters;
      }

      if (parameters && parameters.length > 0) {
        var parts = parameters.split(";")
        for (var i=0;i<parts.length;i++) {
          var part = parts[i];
          var binary = part.split("=");
          if (binary.length == 2) {
            var value = binary[1];
            if (parentId) {
              if (binary[1].match(DEP_PATTERN)) {
                var g = DEP_PATTERN.exec(value);
                if (g[1].indexOf(".active.") != -1) {
                  var field = g[1].replace(this.dependentLazyPost + ".active.", "");
                  if (obj) {
                    map[binary[0]] = obj[field];
                  }
                } else {
                  map[binary[0]] = mapParams[binary[0]];
                }
              } else {
                map[binary[0]] = mapParams[binary[0]];
              }
            } else {
              map[binary[0]] = binary[1] ? this.normalizeValue(value, true) : null;
            }
          }
        }
      }

      return map;
    }

    this.setParameters = function(params) {
      this.parameters = params;
      this.fetch({
        params: {}
      });
    }

    this.removeSlash = function(u) {
      if (u.indexOf("http://") == 0) {
        return "http://" + u.substring(7).split("//").join("/");
      }

      else if (u.indexOf("https://") == 0) {
        return "https://" + u.substring(8).split("//").join("/");
      }

      return u;
    }

    this.setDataSourceEvents = function(events) {
      this.events = events;
    }

    this.addDataSourceEvents = function(events) {
      for (var key in events) {
        if (events.hasOwnProperty(key)) {
          if (!this.events[key]) {
            this.events[key] = [];
          }

          if (Object.prototype.toString.call(this.events[key]) !== '[object Array]') {
            this.events[key] = [this.events[key]];
          }

          this.events[key].push(events[key]);
        }
      }
    }

    this.removeDataSourceEvents = function(events) {
      for (var key in events) {
        if (events.hasOwnProperty(key)) {
          if (!this.events[key]) {
            this.events[key] = [];
          }

          if (Object.prototype.toString.call(this.events[key]) !== '[object Array]') {
            this.events[key] = [this.events[key]];
          }

          var arr = [].concat(this.events[key]);
          for (var i =0;i<arr.length;i++) {
            if (arr[i] == events[key]) {
              this.events[key].splice(i, 1);
            }
          }
        }
      }
    }

    this.callDataSourceEvents = function(key, param) {
      if (this.events) {
        var event = this.events[key];
        if (event) {
          if (Object.prototype.toString.call(event) !== '[object Array]') {
            event = [event];
          }

          var args = [];
          for (var j = 1; j < arguments.length; j++) {
            args.push(arguments[j]);
          }

          for (var i = 0; i < event.length; i++) {
            event[i].apply(null, args);
          }

        }
      }
    }

    this.storeInMemory = function(id) {
      if (!this.memoryData) {
        this.memoryData = {};
      }

      var memory = {
        data: [],
        cursor: this.cursor,
        params: this.getParametersMap(),
        rowCount: this.getRowsCount()
      }

      memory.data = deepCopy(this.data, memory.data);

      this.memoryData[id] = memory;
    }

    this.restoreFromMemory = function(id) {
      if (!this.memoryData) {
        this.memoryData = {};
      }

      var mem = this.memoryData[id];

      if (mem) {
        this.cursor = mem.cursor;
        this.rowsCount = mem.rowCount;
      }

      delete this.memoryData[id]

      return deepCopy(mem.data);
    }

    this.hasPendingChanges = function() {
      var changed = this.hasMemoryData;
      if (this.children) {
        $(this.children).each(function() {
          changed = changed || this.hasPendingChanges();
        });
      }

      return changed;
    }

    this.isPostingBatchData = function() {
      var isPosting = this.postingBatch==true;
      if (this.dependentLazyPost) {
        isPosting = isPosting || eval(this.dependentLazyPost).isPostingBatchData();
      }

      return isPosting;
    }

    this.fetchChildren = function(callback) {
      if (this.children) {
        reduce(this.children, function(item, resolve) {
          item.fetch({}, function() {
            resolve();
          });
        }.bind(this), function() {
          if (callback) {
            callback();
          }
        }.bind(this));
      } else {
        if (callback) {
          callback();
        }
      }
    }

    var splitExpression = function(v) {

      var pair = null;
      var operator;

      if (v.indexOf("@=") != -1) {
        pair = v.trim().split("@=");
        operator = "=";
      } else if (v.indexOf("<=") != -1) {
        pair = v.trim().split("<=");
        operator = "<=";
      } else if (v.indexOf(">=") != -1) {
        pair = v.trim().split(">=");
        operator = ">=";
      } else if (v.indexOf(">") != -1) {
        pair = v.trim().split(">");
        operator = ">";
      } else if (v.indexOf("<") != -1) {
        pair = v.trim().split("<");
        operator = "<";
      } else {
        pair = v.trim().split("=");
        operator = "=";
      }

      var typeElement = typeof this.normalizeValue(pair[1], true);

      if (this.isOData()) {
        if (operator == "=" && typeElement == 'string') {
          return "startswith(tolower("+pair[0]+"), "+pair[1].toLowerCase()+")";
        }
        else if (operator == "=") {
          return pair[0] + " eq "+pair[1];
        }
        else if (operator == "!=") {
          return pair[0] + " ne "+pair[1];
        }
        else if (operator == ">") {
          return pair[0] + " gt {"+pair[1];
        }
        else if (operator == ">=") {
          return pair[0] + " ge "+pair[1];
        }
        else if (operator == "<") {
          return pair[0] + " lt "+pair[1];
        }
        else if (operator == "<=") {
          return pair[0] + " le "+pair[1];
        }
      } else {
        if (typeElement == 'string') {
          return pair[0] + '@' + operator + '%'+pair[1]+'%';
        } else {
          return pair[0] + operator + pair[1];
        }
      }
    }.bind(this);

    var parseFilterExpression = function(expression) {
      var filter = "";
      if (expression) {
        var parts = expression.split(";");
        var doParser = true;
        if (parts.length > 0) {
          var regex = /[\w\d]+=.+/gm
          for (var i = 0; i < parts.length; i++) {
            var match = parts[i].match(regex);
            if (!match){
              doParser = false;
              break;
            }
          }
        }

        if (doParser) {
          for (var i = 0; i < parts.length; i++) {
            var data = splitExpression(parts[i]);
            if (filter != "") {
              filter += this.isOData()?" and ":";";
            }
            filter += data;
          }
        } else {
          filter = expression;
        }
      }

      return filter;
    }.bind(this);

    var getQueryOperator = function(operator) {
      if (operator == '=') {
        return ' eq ';
      } else if (operator == '!=') {
        return ' ne ';
      } else if (operator == '>') {
        return ' gt ';
      } else if (operator == '>=') {
        return ' ge ';
      } else if (operator == '<') {
        return ' lt ';
      } else if (operator == '<=') {
        return ' le ';
      }
    }.bind(this);

    var executeRight = function(right) {
      var result = 'null';
      if (right != null && right != undefined) {
        if (right.startsWith(':') || right.startsWith('datetimeoffset\'') || right.startsWith('datetime\'') ) {
          result = right;
        }
        else {
          result = eval(right);
          if (result instanceof Date) {
            result = "datetimeoffset'" + result.toISOString() + "'";
          }
          else if (typeof result == 'string') {
            result = "'" + result + "'";
          }

          else if (result === undefined || result == null) {
            result = 'null';
          }
        }
      }
      return result;
    }.bind(this);

    this.isEmpty = function(value) {
      return value === '' || value === undefined || value === null || value === '\'\'' || value === 'null';
    }

    this.getFieldFromSchema = function (name) {
      if (this.schema) {
        for (var i = 0; i < this.schema.length; i++) {
          if (this.schema[i].name === name)
            return this.schema[i].type;
        }
      }
      return null;
    };

    this.parserCondition = function (data, strategy, resultData) {
      var result = '';
      var operation = data.type;

      if (!strategy) {
        strategy = "default";
      }

      if (data.args) {
        for (var i = 0; i < data.args.length; i++) {
          var arg = data.args[i];
          var oper = operation;

          if (arg.args && arg.args.length > 0) {

            var value = this.parserCondition(arg, strategy)

            if (this.isEmpty(value) && (strategy == 'ignore' || strategy == 'clean')) {
              if (resultData) {
                resultData.clean = (strategy == 'clean');
              }
            } else {

              if (!this.isEmpty(value)) {
                if (result != '') {
                  result += ' ' + oper.toLowerCase() + ' ';
                }

                result += '( ' + value + ' ) ';
              }
            }
          } else {
            var value = executeRight(arg.right);

            if (this.isEmpty(value) && (strategy == 'ignore' || strategy == 'clean')) {
              if (resultData) {
                resultData.clean = (strategy == 'clean');
              }
            } else {
              if (!this.isEmpty(value)) {

                var canContinue = true;
                var isDate = this.getFieldFromSchema(arg.left) === 'DateTime';
                var objDateMoment = undefined;
                if (isDate && value.indexOf('datetime') === -1) {
                  objDateMoment = this.$scope.cronapi.dateTime.getMomentObj(value);
                  canContinue = objDateMoment.isValid()
                }

                if (canContinue) {

                  if (result != '') {
                    result += ' ' + oper.toLowerCase() + ' ';
                  }

                  if (arg.type == '%') {
                    if (this.isLocalData()) {
                      result += "contains("+arg.left+", "+value.toLowerCase()+")";
                    } else {
                      result += "substringof("+value.toLowerCase()+", tolower("+arg.left+"))";
                    }
                  } else {
                    if (objDateMoment) {
                      var momentTimezoneOffset = objDateMoment.toDate().getTimezoneOffset();
                      var adjustOffset = timeZoneOffset - momentTimezoneOffset;
                      objDateMoment.add(adjustOffset, 'minutes');
                      result += arg.left + getQueryOperator(arg.type) + "datetimeoffset'"+objDateMoment.toISOString()+"'";
                    }
                    else {
                      result += arg.left + getQueryOperator(arg.type) + value;
                    }
                  }

                }
              }
            }
          }
        }
      }
      return result.trim();
    }.bind(this);

    /**
     *  Fetch all data from the server
     */

    this.fetch = function(properties, callbacksObj, isNextOrPrev, fetchOptions) {

      if (this.busy || this.postingBatch) {
        setTimeout(function() {
          this.fetch(properties, callbacksObj, isNextOrPrev, fetchOptions);
        }.bind(this), 1000);
        return;
      }

      if (!fetchOptions) {
        fetchOptions = {};
      }
      var callbacks = callbacksObj || {};

      // Success Handler
      var sucessHandler = function(data, headers, raw) {
        var springVersion = false;
        this.responseHeaders = headers || {};
        var total = -1;

        if (this.entity.indexOf('//') > -1 && this.entity.indexOf('://') < 0)
          data = [];
        if (!raw) {
          if (data) {
            if (Object.prototype.toString.call(data) !== '[object Array]') {
              if (data && data.links && Object.prototype.toString.call(data.content) === '[object Array]') {
                this.links = data.links;
                data = data.content;
                springVersion = true;
              }
              else if (this.isOData()) {
                total = parseInt(data.d.__count);
                data = data.d.results;
                this.normalizeData(data)
              }

              else if (this.isLocalData()) {
                total = data.total_rows;
                data = data.rows;
                this.normalizeData(data)
              }

              else {
                data = [data];
              }
            }
          } else {
            data = [];
          }
        }

        for (var n=0;n<data.length;n++) {
          if (!data[n].__$id) {
            data[n].__$id = uuid();
          }
        }

        if (!fetchOptions.lookup) {

          this.fetched = true;

          // Call the before fill callback
          if (callbacks.beforeFill) callbacks.beforeFill.apply(this, this.data);

          if (isNextOrPrev) {
            // If prepend property was set.
            // Add the new data before the old one
            if (this.prepend) Array.prototype.unshift.apply(this.data, data);

            // If append property was set.
            // Add the new data after the old one
            if (this.append) Array.prototype.push.apply(this.data, data);

            // When neither  nor preppend was set
            // Just replace the current data
            if (!this.prepend && !this.append) {
              Array.prototype.push.apply(this.data, data);
              if (!fetchOptions.ignoreAtive) {
                if (this.data.length > 0) {
                  this.active = data[0];
                  this.cursor = 0;
                } else {
                  this.active = {};
                  this.cursor = -1;
                }
              }
            }
          } else {
            this.cleanup(fetchOptions);
            if (total != -1) {
              this.rowsCount = total;
            }
            Array.prototype.push.apply(this.data, data);
            if (this.data.length > 0) {
              if (!fetchOptions.ignoreAtive) {
                this.active = data[0];
                this.cursor = 0;
              }
            }
          }

          this.columns = [];
          if (this.data.length > 0) {
            for (var i = 0; i < this.data[0].length; i++) {
              this.columns.push(this.getColumn(i));
            }
          }
        }

        if (callbacks.success) callbacks.success.call(this, data);

        if (!fetchOptions.lookup) {
          if (this.events.read) {
            this.callDataSourceEvents('read', data);
          }

          this.hasMoreResults = (data.length >= this.rowsPerPage);

          if (springVersion) {
            this.hasMoreResults = this.getLink("next") != null;
          }

          /*
              *  Register a watcher for data
              *  if the autopost property was set
              *  It means that any change on dataset items will
              *  generate a new request on the server
              */
          if (this.autoPost) {
            this.startAutoPost();
          }

          this.loaded = true;
          this.loadedFinish = true;
          this.handleAfterCallBack(this.onAfterFill);
          var thisDatasourceName = this.name;
          if (!this.isOData()) {
            $('datasource').each(function (idx, elem) {
              var dependentBy = null;
              var dependent = window[elem.getAttribute('name')];
              if (dependent && elem.getAttribute('dependent-by')
                  !== "" && elem.getAttribute('dependent-by')
                  != null) {
                try {
                  dependentBy = JSON.parse(
                      elem.getAttribute('dependent-by'));
                } catch (ex) {
                  dependentBy = eval(
                      elem.getAttribute('dependent-by'));
                }

                if (dependentBy) {
                  if (dependentBy.name == thisDatasourceName) {
                    if (!dependent.filterURL)
                      eval(dependent.name).fetch();
                    //if has filter, the filter observer will be called
                  }
                } else {
                  console.log('O dependente ' + elem.getAttribute(
                      'dependent-by') + ' do pai '
                      + thisDatasourceName + ' ainda não existe.')
                }
              }
            });
          }
        }
        if (this.startMode == 'insert') {
          this.startMode = null;
          this.startInserting();
        }

        if (this.startMode == 'edit') {
          this.startMode = null;
          this.startEditing();
        }
      }.bind(this);

      // Ignore any call if the datasource is busy (fetching another request)
      if (this.busy) {
        if (callbacks.canceled) {
          callbacks.canceled();
        }
        return;
      }

      //Ignore call witouth ids if not http:// or https://
      if (this.entity.indexOf('//') > -1 && this.entity.indexOf('://') < 0) {
        if (callbacks.canceled) {
          callbacks.canceled();
        }
        return;
      }

      if (!this.enabled) {
        this.cleanup();
        if (callbacks.canceled) {
          callbacks.canceled();
        }
        return;
      }

      var props = properties || {};

      // Adjust property parameters and the endpoint url
      props.params = props.params || {};
      var resourceURL = (window.hostApp || "") + this.entity + (props.path || this.lastFilterParsed || "");

      var filter = "";
      var order = "";
      var cleanData = false;
      var canProceed = true;

      if (this.parameters && this.parameters.length > 0) {

        var parsedParameters;

        if (fetchOptions.lookup) {
          parsedParameters = this.$interpolate(this.parametersExpression)(this.$scope);
        } else {
          parsedParameters = this.parameters;
        }

        var parts = parsedParameters.split(";");
        var partsExpression = this.parametersExpression.split(";");
        for (var i=0;i<parts.length;i++) {
          var part = parts[i];
          var partExpression = partsExpression[i];

          var binary = part.split("=");
          var binaryExpression = partExpression.split("=");
          if (binary.length == 2) {
            var filterClause;

            var g = DEP_PATTERN.exec(binaryExpression[1]);
            if (this.isEmpty(binary[1]) && this.dependentLazyPost && g[1] && g[1].startsWith(this.dependentLazyPost+".")) {
              if (this.parametersNullStrategy == "clean" || this.parametersNullStrategy == "default") {
                cleanData = true;
                var dds = eval(this.dependentLazyPost);
                if (dds.active && dds.active.__$id) {
                  filterClause = eval(this.dependentLazyPost).active.__$id;
                } else {
                  filterClause = "memory";
                }
              }
            } else {
              if (this.isEmpty(binary[1])) {
                if (this.parametersNullStrategy == "clean" || this.parametersNullStrategy == "default") {
                  filterClause = 'null';
                  cleanData = true;
                }
              } else {
                filterClause = this.getObjectAsString(this.normalizeValue(binary[1], true));
              }
            }

            if (filterClause) {
              filterClause = binary[0] + getQueryOperator("=") + filterClause;

              if (filter != "") {
                filter += this.isOData()?" and ":";";
              }

              filter += filterClause;
            }
          }
        }
      }

      if (!canProceed) {
        if (callbacks.canceled) {
          callbacks.canceled();
        }
        return;
      }

      var urlParams;

      if (this.condition) {
        try {
          var parsedCondition;

          if (fetchOptions.lookup) {
            parsedCondition = this.$interpolate(this.conditionExpression)(this.$scope);
          } else {
            parsedCondition = this.condition;
          }

          var obj = JSON.parse(parsedCondition);
          if (typeof obj === 'object') {
            var resultData = {};
            if (obj.expression) {
              this.conditionOdata = this.parserCondition(obj.expression, this.parametersNullStrategy, resultData);
            } else {
              this.conditionOdata = this.parserCondition(obj, this.parametersNullStrategy, resultData);
            }

            if (!cleanData && resultData.clean) {
              cleanData = true;
            }

            if (obj.params) {
              for (var i=0;i<obj.params.length;i++) {
                var value = obj.params[i].fieldValue;

                if (value.length >= 2 && value.charAt(0) == "'" && value.charAt(value.length-1) == "'") {
                  value = value.substring(1, value.length-1);
                }

                if (value !== '' && value !== undefined && value !== null) {
                  props.params[obj.params[i].fieldName] = value;
                }
              }
            }
          } else {
            this.conditionOdata = this.condition;
          }
        } catch (e) {
          console.log(e);
        }

        var conditionFilter = parseFilterExpression(this.conditionOdata);
        if (conditionFilter) {
          if (filter != "") {
            filter += this.isOData()?" and ":";";
          }

          filter += conditionFilter;
        }
      }

      if (this.orderBy) {
        var orders = this.orderBy.split(";");
        for (var i=0;i<orders.length;i++) {
          var orderField = orders[i];
          if (orderField) {
            if (order != "") {
              order += this.isOData()?",":";";
            }
            if (this.isOData()) {
              order += orderField.replace("|ASC", " asc").replace("|DESC", " desc");
            } else {
              order += orderField;
            }
          }
        }
      }

      //Check request, if  is dependentLazyPost, break old request
      if (this.dependentLazyPost && !this.parameters && !this.condition) {
        if (eval(this.dependentLazyPost).active) {
          var checkRequestId = '';
          var keyDependentLazyPost = this.getKeyValues(eval(this.dependentLazyPost).active);
          for (var key in keyDependentLazyPost) {
            checkRequestId = keyDependentLazyPost[key]
            break;
          }
          if (checkRequestId && checkRequestId.length > 0)
            if (resourceURL.indexOf(checkRequestId) == -1) {
              if (callbacks.canceled) {
                callbacks.canceled();
              }
              return;
            }
        }
      }

      // Set Limit and offset
      if (this.rowsPerPage > 0) {
        if (this.isOData()) {
          props.params.$top = this.rowsPerPage;
          props.params.$skip = parseInt(this.offset) * parseInt(this.rowsPerPage);
          props.params.$inlinecount = 'allpages';
        } else {
          if (this.apiVersion == 1 || resourceURL.indexOf('/cronapi/') == -1) {
            props.params.limit = this.rowsPerPage;
            props.params.offset = this.offset;
          } else {
            props.params.size = this.rowsPerPage;
            props.params.page = this.offset;
          }
        }
      }

      var paramFilter = null;

      if (this.isOData() && props.params.$filter) {
        paramFilter =  props.params.$filter;
      }

      if (!this.isOData() && props.params.filter) {
        paramFilter =  props.params.filter;
      }

      if (paramFilter) {
        if (filter && filter != '') {
          if (this.isOData()) {
            filter += " and ";
          } else {
            filter += ";";
          }
        }
        filter += paramFilter;
      }

      var paramOrder = null;

      if (this.isOData() && props.params.$orderby) {
        paramOrder =  props.params.$orderby;
      }

      if (!this.isOData() && props.params.order) {
        paramOrder =  props.params.order;
      }

      if (paramOrder) {
        order = paramOrder;
      }

      if (filter) {
        if (this.isOData()) {
          props.params.$filter = filter;
        } else {
          props.params.filter = filter;
        }
      }

      if (order) {
        if (this.isOData()) {
          props.params.$orderby = order;
        } else {
          props.params.order = order;
        }
      }

      var localSuccess;

      if (this.hasMemoryData && filter) {
        if (!this.memoryData) {
          this.memoryData = {};
        }

        if (this.lastFilter == filter) {
          if (callbacks.canceled) {
            callbacks.canceled();
          }
          return;
        }

        var id = filter;
        var mem = this.memoryData[id];

        if (mem) {
          this.storeInMemory(this.lastFilter);
          var data = this.restoreFromMemory(id);
          this.lastFilter = filter;
          sucessHandler(data, null, true);
          return;
        } else {
          localSuccess = function() {
            this.storeInMemory(this.lastFilter);
          }.bind(this);
        }
      }

      // Stop auto post for awhile
      this.stopAutoPost();

      // Store the last configuration for late use
      this._savedProps = props;

      if (cleanData) {
        if (localSuccess) {
          localSuccess();
        }
        this.lastFilter = filter;
        sucessHandler([], null, true);
        return;
      }

      // Make the datasource busy
      this.busy = true;

      // Get an ajax promise
      this.$promise = this.getService("GET")({
        method: "GET",
        url: this.removeSlash(resourceURL),
        params: props.params,
        headers: this.headers,
        filter: filter
      }).success(function(data, status, headers, config) {
        if (localSuccess) {
          localSuccess();
        }
        this.lastFilter = filter;
        this.busy = false;
        if (headers) {
          sucessHandler(data, headers());
        } else {
          sucessHandler(data, null);
        }
      }.bind(this)).error(function(data, status, headers, config) {
        this.busy = false;
        this.handleError(data);
        if (callbacks.error) callbacks.error.call(this, data);
      }.bind(this));


    };

    this.getRowsCount = function() {
      if ( this.rowsCount != -1) {
        return this.rowsCount;
      } else {
        return this.data.length;
      }
    }

    /**
     * Asynchronously notify observers
     */
    this.notifyObservers = function() {
      for (var key in this.observers) {
        if (this.observers.hasOwnProperty(key)) {
          var dataset = this.observers[key];
          $timeout(function() {
            dataset.notify.call(dataset, this.active);
          }.bind(this), 1);
        }
      }
    };

    this.notify = function(activeRow) {
      if (activeRow) {
        // Parse the filter using regex
        // to identify {params}
        var filter = this.watchFilter;
        var pattern = /\{([A-z][A-z|0-9]*)\}/gim;

        // replace all params found by the
        // respectiveValues in activeRow
        filter = filter.replace(pattern, function(a, b) {
          return activeRow.hasOwnProperty(b) ? activeRow[b] : "";
        });

        this.fetch({
          params: {
            q: filter
          }
        });
      }
    };

    this.addObserver = function(observer) {
      this.observers.push(observer);
    };

    this.sum = function(field) {
      var total= 0;
      for (var i=0;i<this.data.length;i++) {
        if (this.data[i][field]) {
          total = total + this.data[i][field];
        }
      }

      return total;
    }

    /**
     * Clone a JSON Object
     */
    this.copy = function(from, to, removeEmptyKeys) {
      if (from === null || Object.prototype.toString.call(from) !== '[object Object]')
        return from;

      to = to || {};

      for (var key in from) {
        if (from.hasOwnProperty(key) && key.indexOf('$$') == -1) {
          to[key] = this.copy(from[key]);
        }
      }

      if (removeEmptyKeys) {
        for (var i = 0; i < this.keys.length; i++) {
          var key = this.keys[i];
          var val = to[key];
          if (val == '' || val == null) {
            delete to[key]
          }
        }
      }
      return to;
    };

    var deepCopyArray = function(from, to) {
      if (from === null || Object.prototype.toString.call(from) !== '[object Array]')
        return from;

      to = to || [];

      for (var i=0;i<from.length;i++) {
        to.push(deepCopy(from[i]));
      }

      return to;
    }

    var deepCopy = function(from, to) {
      if (Object.prototype.toString.call(from) === '[object Array]') {
        return deepCopyArray(from, to);
      }

      if (from === null || Object.prototype.toString.call(from) !== '[object Object]') {
        return from;
      }

      to = to || {};

      for (var key in from) {
        if (from.hasOwnProperty(key)) {
          to[key] = deepCopy(from[key]);
        }
      }

      return to;
    };

    /**
     * Used to monitore the this datasource data for change (insertion and deletion)
     */
    this.startAutoPost = function() {
      this.unregisterDataWatch = $rootScope.$watch(function() {
        return this.data;
      }.bind(this), function(newData, oldData) {

        if (!this.enabled) {
          this.unregisterDataWatch();
          return;
        }

        // Get the difference between both arrays
        var difSize = newData.length - oldData.length;

        if (difSize > 0) {
          // If the value is positive
          // Some item was added
          for (var i = 1; i <= difSize; i++) {
            // Make a new request
            this.insert(newData[newData.length - i], function() {});
          }
        } else if (difSize < 0) {
          // If it is negative
          // Some item was removed
          var _self = this;
          var removedItems = oldData.filter(function(oldItem) {
            return newData.filter(function(newItem) {
              return _self.objectIsEquals(oldItem, newItem);
            }).length == 0;
          });

          for (var i = 0; i < removedItems.length; i++) {
            this.remove(removedItems[i], function() {});
          }
        }
      }.bind(this));
    }

    /**
     * Unregister the data watcher
     */
    this.stopAutoPost = function() {
      // Unregister any defined watcher on data variable
      if (this.unregisterDataWatch) {
        this.unregisterDataWatch();
        this.unregisterDataWatch = undefined;
      }
    }

    this.hasDataBuffered = function() {
      if (this.dependentBufferLazyPostData && this.dependentBufferLazyPostData.length > 0)
        return true;
      else
        return false;
    }

    if (window.afterDatasourceCreate) {
      var args = [$q, $timeout, $rootScope, $window, Notification];
      window.afterDatasourceCreate.apply(this, args);
    }

    this.init();

  };

  /**
   * Dataset Manager Methods
   */
  this.storeDataset = function(dataset) {
    this.datasets[dataset.name] = dataset;
  },

      /**
       * Initialize a new dataset
       */
      this.initDataset = function(props, scope, $compile, $parse, $interpolate, instanceId, translate) {

        var endpoint = (props.endpoint) ? props.endpoint : "";
        var dts = new DataSet(props.name, scope);

        // Add this instance into the root scope
        // This will expose the dataset name as a
        // global variable
        $rootScope[props.name] = dts;
        window[props.name] = dts;
        $rootScope[props.name+".instanceId"] = instanceId;

        var defaultApiVersion = 1;

        dts.entity = props.entity;

        if (window.dataSourceMap && window.dataSourceMap[dts.entity]) {
          dts.entity = window.dataSourceMap[dts.entity].serviceUrlODATA || window.dataSourceMap[dts.entity].serviceUrl;
          if(dts.entity.charAt(0) === "/"){
            dts.entity = dts.entity.substr(1);
          }
        } else {
          if (dts.isLocalData()) {
            var path = dts.entity.substring(dts.entity.indexOf("//")+2, dts.entity.length).split("/");
            dts.localDBType = dts.entity.substring(0, dts.entity.indexOf("://"));
            dts.localDBName = path[0];
            dts.localDBStorage = path[1];
            dts.localDBVersion = path[2]||1;
          }
        }

        if (app && app.config && app.config.datasourceApiVersion) {
          defaultApiVersion = app.config.datasourceApiVersion;
        }

        dts.translate = translate;
        dts.apiVersion = props.apiVersion ? parseInt(props.apiVersion) : defaultApiVersion;
        dts.keys = (props.keys && props.keys.length > 0) ? props.keys.split(",") : [];
        dts.rowsPerPage = props.rowsPerPage ? props.rowsPerPage : 100; // Default 100 rows per page
        dts.append = props.append;
        dts.prepend = props.prepend;
        dts.endpoint = props.endpoint;
        dts.filterURL = props.filterURL;
        dts.autoPost = props.autoPost;
        dts.deleteMessage = props.deleteMessage;
        dts.enabled = props.enabled;
        dts.offset = (props.offset) ? props.offset : 0; // Default offset is 0
        dts.onError = props.onError;
        dts.defaultNotSpecifiedErrorMessage = props.defaultNotSpecifiedErrorMessage;
        dts.onAfterFill = props.onAfterFill;
        dts.onBeforeCreate = props.onBeforeCreate;
        dts.onAfterCreate = props.onAfterCreate;
        dts.onBeforeUpdate = props.onBeforeUpdate;
        dts.onAfterUpdate = props.onAfterUpdate;
        dts.onBeforeDelete = props.onBeforeDelete;
        dts.onAfterDelete = props.onAfterDelete;
        dts.onGET = props.onGet,
            dts.onPOST = props.onPost,
            dts.onPUT = props.onPut,
            dts.onDELETE = props.onDelete,
            dts.dependentBy = props.dependentBy;
        dts.parameters = props.parameters;
        dts.parametersNullStrategy = props.parametersNullStrategy;
        dts.parametersExpression = props.parametersExpression;
        dts.checkRequired = props.checkRequired;
        dts.batchPost = props.batchPost;
        dts.condition = props.condition;
        dts.conditionExpression = props.conditionExpression;
        dts.orderBy = props.orderBy;
        dts.schema = props.schema;
        dts.startMode = props.startMode;
        dts.lazy = props.lazy;
        dts.$compile = $compile;
        dts.$parse = $parse;
        dts.$interpolate = $interpolate;

        if (props.dependentLazyPost && props.dependentLazyPost.length > 0) {
          dts.dependentLazyPost = props.dependentLazyPost;
          eval(dts.dependentLazyPost).addDependentDatasource(dts);
        }

        dts.dependentLazyPostField = props.dependentLazyPostField; //TRM

        // Check for headers
        if (props.headers && props.headers.length > 0) {
          dts.headers = {"X-From-DataSource": "true"};
          var headers = props.headers.trim().split(";");
          var header;
          for (var i = 0; i < headers.length; i++) {
            header = headers[i].split(":");
            if (header.length === 2) {
              dts.headers[header[0]] = header[1];
            }
          }
        }

        this.storeDataset(dts);
        dts.allowFetch = true;

        if (dts.dependentBy && dts.dependentBy !== "" && dts.dependentBy.trim() !== "") {
          dts.allowFetch = false;

          //if dependentBy was loaded, the filter in this ds not will be changed and the filter observer not will be called
          var dependentBy = null;
          try {
            dependentBy = JSON.parse(dependentBy);
          } catch (ex) {
            dependentBy = eval(dependentBy);
          }

          if (dependentBy && dependentBy.loadedFinish)
            dts.allowFetch = true;
        }

        if (!props.lazy && dts.allowFetch && (Object.prototype.toString.call(props.watch) !== "[object String]") && !props.filterURL) {
          // Query string object
          var queryObj = {};

          // Fill the dataset
          dts.fetch({
            params: queryObj
          }, {
            success: function(data) {
              if (data && data.length > 0) {
                this.active = data[0];
                this.cursor = 0;
              }
            }
          });
        }

        if (props.lazy && props.autoPost) {
          dts.startAutoPost();
        }

        if (props.watch && Object.prototype.toString.call(props.watch) === "[object String]") {
          this.registerObserver(props.watch, dts);
          dts.watchFilter = props.watchFilter;
        }

        // Filter the dataset if the filter property was set
        if (props.filterURL && props.filterURL.length > 0 && dts.allowFetch) {
          dts.filter(props.filterURL);
        }

        return dts;
      };

  /**
   * Register a dataset as an observer to another one
   */
  this.registerObserver = function(targetName, dataset) {
    this.datasets[targetName].addObserver(dataset);
  };

  return this;
}])

/**
 * Cronus Dataset Directive
 */
.directive('datasource', ['DatasetManager', '$timeout', '$parse', 'Notification', '$translate', '$location','$rootScope', '$compile', '$interpolate', function(DatasetManager, $timeout, $parse, Notification, $translate, $location, $rootScope, $compile, $interpolate) {
  return {
    restrict: 'E',
    scope: true,
    template: '',
    link: function(scope, element, attrs) {
      var instanceId =  parseInt(Math.random() * 9999);
      var init = function() {

        //Add in header the path from the request was executed
        var originPath = "origin-path:" + $location.path();
        if (attrs.headers === undefined || attrs.headers === null) {
          attrs.headers = originPath;
        } else {
          attrs.headers = attrs.headers.concat(";", originPath);
        }

        var props = {
          name: attrs.name,
          entity: attrs.entity,
          apiVersion: attrs.apiVersion,
          enabled: (attrs.hasOwnProperty('enabled')) ? (attrs.enabled === "true") : true,
          keys: attrs.keys,
          endpoint: attrs.endpoint,
          lazy: attrs.lazy === "true",
          append: !attrs.hasOwnProperty('append') || attrs.append === "true",
          prepend: (attrs.hasOwnProperty('prepend') && attrs.prepend === "") || attrs.prepend === "true",
          watch: attrs.watch,
          rowsPerPage: attrs.rowsPerPage,
          offset: attrs.offset,
          filterURL: attrs.filter,
          watchFilter: attrs.watchFilter,
          deleteMessage: attrs.deleteMessage || attrs.deleteMessage === "" ? attrs.deleteMessage : $translate.instant('General.RemoveData'),
          headers: attrs.headers,
          autoPost: attrs.autoPost === "true",
          onError: attrs.onError,
          onAfterFill: attrs.onAfterFill,
          onBeforeCreate: attrs.onBeforeCreate,
          onAfterCreate: attrs.onAfterCreate,
          onBeforeUpdate: attrs.onBeforeUpdate,
          onAfterUpdate: attrs.onAfterUpdate,
          onBeforeDelete: attrs.onBeforeDelete,
          onAfterDelete: attrs.onAfterDelete,
          onGet: attrs.onGet,
          onPost: attrs.onPost,
          onPut: attrs.onPut,
          onDelete: attrs.onDelete,
          defaultNotSpecifiedErrorMessage: $translate.instant('General.ErrorNotSpecified'),
          dependentBy: attrs.dependentBy,
          dependentLazyPost: attrs.dependentLazyPost,
          batchPost: attrs.batchpost === "true",
          dependentLazyPostField: attrs.dependentLazyPostField,
          parameters: attrs.parameters,
          parametersNullStrategy: attrs.parametersNullStrategy?attrs.parametersNullStrategy:"default",
          parametersExpression: $(element).attr('parameters'),
          conditionExpression: $(element).attr('condition'),
          condition: attrs.condition,
          orderBy: attrs.orderBy,
          schema: attrs.schema ? JSON.parse(attrs.schema) : undefined,
          checkRequired: !attrs.hasOwnProperty('checkrequired') || attrs.checkrequired === "" || attrs.checkrequired === "true"
        }

        var firstLoad = {
          filter: true,
          entity: true,
          enabled: true,
          parameters: true
        }

        var urlParameters;
        if (scope.params) {
          for (var paramKey in scope.params) {
            if (scope.params.hasOwnProperty(paramKey)) {
              var value = scope.params[paramKey];
              if (paramKey.startsWith("$"+attrs.name+".")) {
                var key = paramKey.split(".");
                if (key.length == 2) {
                  if (key[1] == "$filterMode") {
                    props.startMode = value;
                  } else {
                    if (urlParameters) {
                      urlParameters += ";";
                    } else {
                      urlParameters = "";
                    }
                    if (!isNaN(value)) {
                      urlParameters += key[1]+"="+value;
                    } else {
                      urlParameters += key[1]+"='"+value+"'";
                    }


                  }
                }

              }
            }
          }

          if (urlParameters) {
            props.parameters = urlParameters;
            props.parametersExpression = urlParameters;
          }
        }

        var instanceId =  parseInt(Math.random() * 9999);
        var datasource = DatasetManager.initDataset(props, scope, $compile, $parse, $interpolate, instanceId, $translate);
        var timeoutPromise;

        attrs.$observe('filter', function(value) {
          if (datasource.isPostingBatchData()) {
            return;
          }

          if (!firstLoad.filter) {
            // Stop the pending timeout
            $timeout.cancel(timeoutPromise);

            // Start a timeout
            timeoutPromise = $timeout(function() {
              if (datasource.events.overRideRefresh) {
                datasource.callDataSourceEvents('overRideRefresh', 'filter', value);
              } else {
                datasource.filter(value, function (data) {
                  if (datasource.events.refresh) {
                    datasource.callDataSourceEvents('refresh', data, 'filter');
                  }
                });
              }
              datasource.lastFilterParsed = value;
            }, 100);
          } else {
            $timeout(function() {
              firstLoad.filter = false;
            }, 0);
          }
        });

        if (!urlParameters) {
          attrs.$observe('parameters', function(value) {
            if (datasource.isPostingBatchData()) {
              return;
            }

            if (datasource.parameters != value) {
              datasource.parameters = value;

              $timeout.cancel(timeoutPromise);
              timeoutPromise =$timeout(function() {
                datasource.callDataSourceEvents('changeDependency', 'parameters', datasource.parameters);

                if (datasource.events.overRideRefresh) {
                  datasource.callDataSourceEvents('overRideRefresh', 'parameters', datasource.parameters);
                } else {
                  datasource.fetch({
                    params: {}
                  }, {
                    success: function (data) {
                      if (datasource.events.refresh) {
                        datasource.callDataSourceEvents('refresh', data, 'parameters');
                      }
                    }
                  });
                }
              }, 0);

            }
          });
        }

        attrs.$observe('condition', function(value) {
          if (datasource.isPostingBatchData()) {
            return;
          }

          if (datasource.condition != value) {
            datasource.condition = value;

            $timeout.cancel(timeoutPromise);
            timeoutPromise =$timeout(function() {
              datasource.callDataSourceEvents('changeDependency', 'condition', datasource.condition);

              if (datasource.events.overRideRefresh) {
                datasource.callDataSourceEvents('overRideRefresh', 'condition', datasource.condition);
              } else {
                datasource.fetch({
                  params: {}
                }, {
                  success: function (data) {
                    if (datasource.events.refresh) {
                      datasource.callDataSourceEvents('refresh', data, 'condition');
                    }
                  }
                });
              }
            }, 0);

          }
        });

        attrs.$observe('enabled', function(value) {
          var boolValue = (value === "true");

          if (datasource.enabled != boolValue) {
            datasource.enabled = boolValue;

            if (datasource.enabled) {
              $timeout.cancel(timeoutPromise);
              timeoutPromise =$timeout(function () {
                if (datasource.events.overRideRefresh) {
                  datasource.callDataSourceEvents('overRideRefresh', 'enabled', datasource.parameters);
                } else {
                  datasource.fetch({
                        params: {}
                      },
                      {
                        success: function (data) {
                          if (datasource.events.refresh) {
                            datasource.callDataSourceEvents('refresh', data, 'enabled');
                          }
                        }
                      }
                  );
                }
              }, 200);
            }
          }
        });

        attrs.$observe('entity', function(value) {
          datasource.entity = value;

          if (window.dataSourceMap && window.dataSourceMap[datasource.entity]) {
            datasource.entity = window.dataSourceMap[datasource.entity].serviceUrlODATA || window.dataSourceMap[datasource.entity].serviceUrl;
            if(datasource.entity.charAt(0) === "/"){
              datasource.entity = datasource.entity.substr(1);
            }
          }

          if (!firstLoad.entity) {
            // Only fetch if it's not the first load

            $timeout.cancel(timeoutPromise);

            timeoutPromise = $timeout(function() {
              datasource.fetch({
                    params: {}
                  },
                  {
                    success : function (data) {
                      if (datasource.events.refresh) {
                        datasource.callDataSourceEvents('refresh', data, 'entity');
                      }
                    }
                  }
              );
            }, 200);
          } else {
            $timeout(function() {
              firstLoad.entity = false;
            });
          }
        });

      };
      init();
      scope.$on('$destroy', function() {
        if ($rootScope[attrs.name] && $rootScope[attrs.name+".instanceId"] == instanceId) {
          $rootScope[attrs.name].destroy();
          delete window[attrs.name];
          delete $rootScope[attrs.name];
          delete  $rootScope[attrs.name+".instanceId"];
        }
      });
    }
  };
}])

app.directive('crnRepeat', function(DatasetManager, $compile, $parse, $injector, $rootScope) {
  return {
    restrict: 'A',
    priority: 9999998,
    terminal: true,
    link: function(scope, element, attrs, controllers, transclude) {

      if (attrs.crnRepeat) {
        scope.data = DatasetManager.datasets;
        if (scope.data[attrs.crnRepeat]) {
          scope.datasourceRepeat = scope.data[attrs.crnRepeat];
        } else {
          scope.datasourceRepeat = {};
          scope.datasourceRepeat.data = $parse(attrs.crnRepeat)(scope);
        }
        element.attr('ng-repeat', 'rowData in datasourceRepeat.data');

      }

      var tagName = element[0].tagName;
      $compile(element, null, 9999998)(scope);
      scope.$watchCollection('datasourceRepeat.data', function (newVal, oldVal) {
        if (tagName.toLowerCase() == "ion-slide") {
          var $ionicSlideBoxDelegate = $injector.get('$ionicSlideBoxDelegate');
          $ionicSlideBoxDelegate.slide(0);
          $ionicSlideBoxDelegate.update();
        }
      });
    }
  };
})

.directive('crnDatasource', ['DatasetManager', '$parse', '$rootScope', function(DatasetManager, $parse, $rootScope) {
  return {
    restrict: 'A',
    scope: true,
    priority: 9999998,
    link: function(scope, element, attrs) {
      scope.data = DatasetManager.datasets;
      if (scope.data[attrs.crnDatasource]) {
        scope.datasource = scope.data[attrs.crnDatasource];
      } else {
        scope.datasource = {};
        scope.datasource.data = $parse(attrs.crnDatasource)(scope);
      }
    }
  };
}]);