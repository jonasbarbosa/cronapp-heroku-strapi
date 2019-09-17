declare var $: any;

(function() {
  'use strict';

  this.cronapi = this.cronapi||{};

  /**
   * @category CategoryType.UTIL
   * @categoryTags Util
   */
  this.cronapi.util = this.cronapi.util||{};

  /**
   * @type function
   * @name {{callServerBlockly}}
   * @nameTags callServerBlockly
   * @description {{functionToCallServerBlockly}}
   * @param {ObjectType.STRING} classNameWithMethod {{classNameWithMethod}}
   * @param {ObjectType.OBJECT} params {{params}}
   * @arbitraryParams true
   * @wizard procedures_callblockly_callreturn
   * @returns {ObjectType.OBJECT}
   */
  this.cronapi.util.callServerBlockly = async function(classNameWithMethod, ...params: any[]) {
    
      var serverUrl = 'api/cronapi/call/body/#classNameWithMethod#/'.replace('#classNameWithMethod#', classNameWithMethod);
      var params = [];
  
      var fields = this.cronapi.util.getScreenFields();
  
      var dataCall = {
        "fields": fields,
        "inputs": params
      };
  
      var token = "";
      if (window['uToken'])
        token = window['uToken'];
  
      var resultData;
      
      try {
        resultData = await $.ajax({
          type: 'POST',
          url: (window['hostApp'] || "") + serverUrl,
          dataType: 'html',
          data : JSON.stringify(dataCall),
          async: true,
          headers : {
            'Content-Type' : 'application/json',
            'X-AUTH-TOKEN' : token,
            'toJS' : true
          }
        });
      } catch(e) {
        var message = this.cronapi.internal.getErrorMessage(e.responseText, e.statusText);
        this.cronapi.$scope.Notification.error(message);
        throw message;
      }
      
      var result;
  
      var objectConstructor = {}.constructor;
  
      if (resultData.constructor === objectConstructor) {
          result = resultData;
      }  else {
          result = this.cronapi.evalInContext(resultData);
      }
      
      return result;
  };

}).bind(window)();