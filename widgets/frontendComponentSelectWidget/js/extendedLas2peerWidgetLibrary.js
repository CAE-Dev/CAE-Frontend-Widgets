/*
 * Copyright (c) 2015 Advanced Community Information Systems (ACIS) Group, Chair
 * of Computer Science 5 (Databases & Information Systems), RWTH Aachen
 * University, Germany All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 * 
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * 
 * Neither the name of the ACIS Group nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Instantiates a new Las2peerWidgetLibrary, given its endpoint URL and the
 * IWC-callback function.
 */
function Las2peerWidgetLibrary(endpointUrl, iwcCallback) {
  // care for widget frontends without a microservice backend
  if (endpointUrl === null) {
    endpointUrl = "not specified";
  }
  // care for trailing slash in endpoint URL
  if (endpointUrl.endsWith("/")) {
    this._serviceEndpoint = endpointUrl.substr(0, endpointUrl.length - 1);
  } else {
    this._serviceEndpoint = endpointUrl;
  }
  this.iwcClient = new iwc.Client();
  this.callback = iwcCallback;
  this.iwcClient.connect(this.callback);
}

/**
 *
 * Sends an AJAX request to a resource.
 * 
 * @override
 * @this {Las2peerWidgetLibrary}
 * @param {string}
 *          method the HTTP method used
 * @param {string}
 *          relativePath the path relative to the client's endpoint URL
 * @param {object}
 *          content the content to be sent in the HTTP request's body
 * @param {string}
 *          mime - the MIME-type of the content
 * @param {string}
 *          customHeaders a JSON string with additional header parameters to be
 *          sent
 * @param {string}
 *          successCallback a callback function invoked in case the request
 *          succeeded. Expects two parameters "data" and "type" where "data"
 *          represents the content of the response and "type" describes the
 *          MIME-type of the response.
 * @param {string}
 *          errorCallback a callback function invoked in case the request
 *          failed. Expects one parameter "error" representing the error
 *          occurred.
 *
 */
Las2peerWidgetLibrary.prototype.sendRequest = function(method, relativePath,
        content, mime, customHeaders, successCallback, errorCallback) {
  var mtype = "text/plain; charset=UTF-8"
  if (mime !== 'undefined') {
    mtype = mime;
  }

  var rurl = this._serviceEndpoint + "/" + relativePath;

  if (!this.isAnonymous()) {
    console.log("Authenticated request");
    if (rurl.indexOf("\?") > 0) {
      rurl += "&access_token=" + window.localStorage["access_token"];
    } else {
      rurl += "?access_token=" + window.localStorage["access_token"];
    }
  } else {
    console.log("Anonymous request... ");
  }

  var ajaxObj = {
    url: rurl,
    type: method.toUpperCase(),
    data: content,
    contentType: mtype,
    crossDomain: true,
    headers: {},

    error: function(xhr, errorType, error) {
      console.log(error);
      var errorText = error;
      if (xhr.responseText != null && xhr.responseText.trim().length > 0) {
        errorText = xhr.responseText;
      }
      errorCallback(errorText);
    },
    success: function(data, status, xhr) {
      var type = xhr.getResponseHeader("Content-Type");
      successCallback(data, type);
    },
  };

  if (customHeaders !== undefined && customHeaders !== null) {
    $.extend(ajaxObj.headers, customHeaders);
  }

  $.ajax(ajaxObj);
};


/**
 *
 * Determines if user is authenticated via OpenID Connect or not.
 *
 */
Las2peerWidgetLibrary.prototype.isAnonymous = function() {
  if (typeof oidc_userinfo !== 'undefined') {
    return false;
  } else {
    return true;
  }
};


/**
 *
 * Sends a signal to the canvas that a frontend component was selected,
 * such that the next click there will add a frontend component to the canvas.
 *
 */
Las2peerWidgetLibrary.prototype.sendFrontendComponentSelected = function(frontendComponentName) {
  var time = new Date().getTime();
  var data = JSON.stringify({selectedToolName: "Frontend Component"});
  var intent = {
    "component": "MAIN",
    "data": "",
    "dataType": "",
    "action": "ACTION_DATA",
    "flags": ["PUBLISH_LOCAL"],
    "extras": {"payload":{"data":{"data":data,"type":"ToolSelectOperation"}, "sender":null, "type":"NonOTOperation"}, "time":time},
    "sender": "FRONTEND_COMPONENT_SELECT_WIDGET"
  };
  this.iwcClient.publish(intent);
};


/**
 *
 * Sends the frontend component label to SyncMeta.
 *
 */
Las2peerWidgetLibrary.prototype.sendFrontendComponentName = function(frontendComponentName, nodeId) {
  var time = new Date().getTime();
  var frontendComponentArray = frontendComponentName.split('');
  var arrayLength = frontendComponentArray.length;
  var payload = [];
  payload.length = arrayLength;
  for (var i = 0; i < arrayLength; i++) {
  var data = {};
  data.name = "val:" + nodeId + "[label]";
  data.position = i;
  data.type = "insert";
  data.value = frontendComponentArray[i];
  var singlePayload = {};
  
  singlePayload.data = data;
  singlePayload.type = "OTOperation";
  singlePayload.sender = null;
  payload[i] = singlePayload;
  }
  var intent = {
    "component": "MAIN",
    "data": "",
    "dataType": "",
    "action": "ACTION_DATA_ARRAY",
    "flags": ["PUBLISH_LOCAL"],
    "extras": {"payload":payload, "time":time},
    "sender": "FRONTEND_COMPONENT_SELECT_WIDGET"
  };
  this.iwcClient.publish(intent);
  intent = {
    "component": "ATTRIBUTE",
    "data": "",
    "dataType": "",
    "action": "ACTION_DATA_ARRAY",
    "flags": ["PUBLISH_LOCAL"],
    "extras": {"payload":payload, "time":time},
    "sender": "FRONTEND_COMPONENT_SELECT_WIDGET"
  };
  this.iwcClient.publish(intent);
};


/**
 *
 * Convenience function to check if a String ends with a given suffix.
 *
 */
String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
