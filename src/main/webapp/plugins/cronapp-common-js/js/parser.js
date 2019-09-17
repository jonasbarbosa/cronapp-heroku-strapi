(function() {

  var ISO_PATTERN  = new RegExp("(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))");
  var TIME_PATTERN  = new RegExp("^PT(?:(\\d\\d?)H)?(?:(\\d\\d?)M)?(?:(\\d\\d?)(?:\\.(\\d\\d?\\d?)?)?S)?$");

  window.stringToJs = function(value) {
    var formated = "";

    if (value != undefined && value != null) {
      value = value.toString();
      for (var i = 0; i < value.length; i++) {
        var c = value.charAt(i);
        if (c == "\\") {
          formated += "\\\\";
        } else if (c == "'") {
          formated += "\\'";
        } else if (c == "\"") {
          formated += "\\\"";
        } else if (c == "\n") {
          formated += "\\n";
        } else if (c == "\r") {
        } else {
          formated += c;
        }
      }
    }

    return formated;
  }

  window.objToOData = function(o) {
    if (o == null || o == undefined) {
      return "null";
    }
    else if (typeof o == 'number' || typeof o == 'boolean') {
      return o+"";
    }
    else if (o instanceof Date) {
      return "datetimeoffset'"+o.toISOString()+"'";
    }

    return "'"+o+"'";
  }

  window.oDataToObj = function(value, unquote) {
    if (unquote == null || unquote == undefined) {
      unquote = true;
    }

    if (typeof value == 'string') {
      if (value.length >= 10 && value.match(ISO_PATTERN) && value.length < 100) {
        return new Date(value);
      }
      else if (value.length >= 4 && value.match(TIME_PATTERN) && value.length < 100) {
        try {
          var momentDate = moment().utcOffset(window.systemTimeZoneOffset, true);

          var g = TIME_PATTERN.exec(value);

          momentDate = momentDate.hour(g[1]).minute(g[2]).second(g[3]).year(1970).dayOfYear(1).month(0);

          return momentDate.toDate();
        }
        catch (e) {
          return value;
        }
      }
      else if (value.length >= 10 && value.substring(0, 6) == '/Date(' && value.substring(value.length - 2, value.length) == ")/") {
        var r = value.substring(6, value.length-2);
        return new Date(parseInt(r));
      }
      else if (value.length >= 20 && value.substring(0, 9) == "datetime'" && value.substring(value.length - 1, value.length) == "'") {
        var r = value.substring(9, value.length-1);
        return new Date(r);
      }
      else if (value.length >= 20 && value.substring(0, 15) == "datetimeoffset'" && value.substring(value.length - 1, value.length) == "'") {
        var r = value.substring(15, value.length-1);
        return new Date(r);
      }
      else if (unquote) {
        if (value.length >= 2 && ((value.charAt(0) == "'" && value.charAt(value.length-1) == "'") || (value.charAt(0) == "\"" && value.charAt(value.length-1) == "\"")) ) {
          var r = value.substring(1, value.length-1);
          return r;
        }

        else if (value == 'true' || value == 'false') {
          return (value == 'true')
        }

        else if (value == 'null') {
          return null;
        }

        else if (value != '') {
          return parseFloat(value);
        }
      }
    }

    return value;
  }

  window.parseXml = function(xml) {
    var dom = null;

    if (window.DOMParser) {
      try {
        dom = (new DOMParser()).parseFromString(xml, "text/xml");
      } catch (e) {
        dom = null;
      }
    } else if (window.ActiveXObject) {
      try {
        dom = new ActiveXObject('Microsoft.XMLDOM');
        dom.async = false;
        if (!dom.loadXML(xml)) {
          console.log(dom.parseError.reason + dom.parseError.srcText);
        }
      }
      catch (e) {
        dom = null;
      }
    }

    return dom;
  }

  window.xml2json = function(xml, tab) {
    var X = {
      toObj: function(xml) {
        var o = {};
        if (xml.nodeType==1) {   // element node ..
          if (xml.attributes.length)   // element with attributes  ..
            for (var i=0; i<xml.attributes.length; i++)
              o["@"+xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue||"").toString();
          if (xml.firstChild) { // element has child nodes ..
            var textChild=0, cdataChild=0, hasElementChild=false;
            for (var n=xml.firstChild; n; n=n.nextSibling) {
              if (n.nodeType==1) hasElementChild = true;
              else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
              else if (n.nodeType==4) cdataChild++; // cdata section node
            }
            if (hasElementChild) {
              if (textChild < 2 && cdataChild < 2) {
                X.removeWhite(xml);
                for (var n=xml.firstChild; n; n=n.nextSibling) {
                  if (n.nodeType == 3)
                    o["#text"] = X.escape(n.nodeValue);
                  else if (n.nodeType == 4)
                    o["#cdata"] = X.escape(n.nodeValue);
                  else if (o[X.normalizeName(n.nodeName)]) {  // multiple occurence of element ..
                    if (o[X.normalizeName(n.nodeName)] instanceof Array)
                      o[X.normalizeName(n.nodeName)][o[X.normalizeName(n.nodeName)].length] = X.toObj(n);
                    else
                      o[X.normalizeName(n.nodeName)] = [o[X.normalizeName(n.nodeName)], X.toObj(n)];
                  } else {
                    o[X.normalizeName(n.nodeName)] = X.toObj(n);
                  }
                }
              } else {
                if (!xml.attributes.length)
                  o = X.escape(X.innerXml(xml));
                else
                  o["#text"] = X.escape(X.innerXml(xml));
              }
            } else if (textChild) { // pure text
              if (!xml.attributes.length)
                o = X.escape(X.innerXml(xml));
              else
                o["#text"] = X.escape(X.innerXml(xml));
            } else if (cdataChild) { // cdata
              if (cdataChild > 1)
                o = X.escape(X.innerXml(xml));
              else
                for (var n=xml.firstChild; n; n=n.nextSibling)
                  o["#cdata"] = X.escape(n.nodeValue);
            }
          }

          if (!xml.attributes.length && !xml.firstChild) {
            o = null;
          }

        } else if (xml.nodeType==9) {
          o = X.toObj(xml.documentElement);
        } else {
          console.log("unhandled node type: " + xml.nodeType);
        }

        return o;
      },
      normalizeName : function(str) {
        if (str && (str.length > 5) && (str.indexOf('cron-') == 0)) {
          str = str.substr(5);

          var result = "";
          var camelCase = false;
          for (var i in str) {
            var s = str.charAt(i);
            if (camelCase && s != "-") {
              result += s.toUpperCase();
              camelCase = false;
            } else if (s == "-") {
              camelCase = true;
            } else {
              result += s.toLowerCase();
            }
          }

          return result;
        }
      },
      toJson: function(o, name, ind) {
        var json = name ? ("\""+name+"\"") : "";
        if (o instanceof Array) {
          for (var i=0,n=o.length; i<n; i++)
            o[i] = X.toJson(o[i], "", ind+"\t");
          json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
        }
        else if (o == null)
          json += (name&&":") + "null";
        else if (typeof(o) == "object") {
          var arr = [];
          for (var m in o)
            arr[arr.length] = X.toJson(o[m], m, ind+"\t");
          json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
        }
        else if (typeof(o) == "string") {
          var value = $.trim(o.toString());
          json += (name && ":") + "\"" + X.htmlDecode(value) + "\"";
        } else {
          json += (name && ":") + X.htmlDecode($.trim(o.toString()));
        }

        return json;
      },
      htmlDecode: function (input){
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
      },
      innerXml: function(node) {
        var s = "";
        if ("innerHTML" in node)
          s = node.innerHTML;
        else {
          var asXml = function(n) {
            var s = "";
            if (n.nodeType == 1) {
              s += "<" + n.nodeName;
              for (var i=0; i<n.attributes.length;i++)
                s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
              if (n.firstChild) {
                s += ">";
                for (var c=n.firstChild; c; c=c.nextSibling)
                  s += asXml(c);
                s += "</"+n.nodeName+">";
              }
              else
                s += "/>";
            }
            else if (n.nodeType == 3)
              s += n.nodeValue;
            else if (n.nodeType == 4)
              s += "<![CDATA[" + n.nodeValue + "]]>";
            return s;
          };
          for (var c=node.firstChild; c; c=c.nextSibling)
            s += asXml(c);
        }
        return s;
      },
      escape: function(txt) {
        return txt.trim()
            .replace(/[\\]/g, "\\\\")
            .replace(/[\"]/g, '\\"')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r');
      },
      removeWhite: function(e) {
        e.normalize();
        for (var n = e.firstChild; n; ) {
          if (n.nodeType == 3) {  // text node
            if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
              var nxt = n.nextSibling;
              e.removeChild(n);
              n = nxt;
            }
            else
              n = n.nextSibling;
          }
          else if (n.nodeType == 1) {  // element node
            X.removeWhite(n);
            n = n.nextSibling;
          }
          else                      // any other node
            n = n.nextSibling;
        }
        return e;
      }
    };

    if (xml.nodeType == 9) {
      xml = xml.documentElement;
    }

    var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");

    return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
  }

  window.json2xml = function(json, tagName) {
    var a = json;
    var c = document.createElement(tagName);

    var t = function (v) {
      return {}.toString.call(v).split(' ')[1].slice(0, -1).toLowerCase();
    };

    var normalizeName = function(str) {
      var result = "";

      for (var i in str) {
        var s = str.charAt(i);

        if ((i > 0) && (s == s.toUpperCase())) {
          result += "-";
        }

        result += s.toLowerCase();
      }

      return 'cron-' + result;
    }

    var f = function (f, c, a, s) {
      if (t(a) != "array" && t(a) != "object") {
        if (t(a) != "null") {
          c.appendChild(document.createTextNode(a));
        }
      } else {
        for (var k in a) {
          var v = a[k];
          if (k == "__type" && t(a) == "object") {
            c.setAttribute("__type", v);
          } else {
            if (t(v) == "object") {
              var ch = c.appendChild(document.createElementNS(null, normalizeName(k)));
              f(f, ch, v);
            } else if (t(v) == "array") {
              for (var item in v) {
                var ch = c.appendChild(document.createElementNS(null, normalizeName(k)));
                f(f, ch, v[item], true);
              }
            } else {
              var va = document.createElementNS(null, normalizeName(k));

              if (t(v) != "null") {
                if (t(v) == "string") {
                  v = v.trim();
                }

                va.appendChild(document.createTextNode(v));
              }

              var ch = c.appendChild(va);
            }
          }
        }
      }
    };

    f(f, c, a, t(a) == "array");

    return c.outerHTML;
  }

  window.buildElementOptions = function(element) {
    var options = $(element).closest("[data-component]").find("cron-options");
    var dom = parseXml('<cron-options>' + $(options).html() + '</cron-options>');
    var json = xml2json(dom);

    if (json) {
      json = json.slice(1);
      json = json.substring(0, json.length - 1);
      json = json.trim();
      json = json.replace(/undefined"cron-options":/gm,'');
      json = json.replace(/"undefined"/gm,'');
      json = json.replace(/"undefined:"/gm,'');
      json = json.replace(/undefined:/gm,'');
      json = json.replace(/undefined/gm,'');
      json = json.replace(/"cron-options":/gm,'');
    }

    return json;
  }

  window.objectClone = function(obj, validFields) {
    var copy;

    if (null == obj || "object" != typeof obj) {
      return obj;
    }

    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (obj instanceof Array) {
      copy = [];

      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = objectClone(obj[i], undefined);
      }

      return copy;
    }

    var validFieldObject = function(attr, validFields) {
      /*
       *  Se não informou o dataSource, executa um clone comum de objeto.
       */
      if (!validFields) {
        return true;
      } else {
        /*
         *  Senão, analisa se o campo informado está na relação de validFields.
         */
        for (var field in validFields) {
          if (attr == field) {
            return true;
          }
        }

        return false;
      }
    }

    var isFunction = function(functionToCheck) {
      return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    if (obj instanceof Object) {
      copy = {};

      for (var attr in obj) {
        if ((obj.hasOwnProperty(attr)) && (obj[attr] != undefined) &&
            (attr.substr(0,1) != '_') && (!isFunction(obj[attr])) &&
            (validFieldObject(attr, validFields))) {
          copy[attr] = objectClone(obj[attr], validFields[attr]);
        }
      }

      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  window.getOperatorODATA = function(left, operator, right) {
    if (operator == '%') {
      return 'substringof(' + right + ', ' + left + ')';
    } else if (operator == '=') {
      return left + ' eq ' + right;
    } else if (operator == '!=') {
      return left + ' ne ' + right;
    } else if (operator == '>') {
      return left + ' gt ' + right;
    } else if (operator == '>=') {
      return left + ' ge ' + right;
    } else if (operator == '<') {
      return left + ' lt ' + right;
    } else if (operator == '<=') {
      return left + ' le ' + right;
    }
  }

  window.executeRight = function(right) {
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
  };

  window.parserOdata = function (data) {
    var result = '';
    var operation = data.type;

    if (data.args) {
      for (var i = 0; i < data.args.length; i++) {
        var arg = data.args[i];
        var oper = operation;
        if (i == 0) {
          oper = '';
        }
        if (arg.args && arg.args.length > 0) {
          result = result + ' ' + oper.toLowerCase() + ' ( ' + parserOdata(arg) + ' ) ';
        } else {
          result = result + ' ' + oper.toLowerCase() + ' ' + getOperatorODATA(arg.left, arg.type, executeRight(arg.right));
        }
      }
    }
    return result.trim();
  }

})();