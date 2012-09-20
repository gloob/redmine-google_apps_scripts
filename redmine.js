/*
 * Connector to Redmine from Google Apps Scripts platform.
 *
 * Copyright (c) 2011,2012 Emergya
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * Author: Alejandro Leiva <aleiva@emergya.com>
 *
 */

var REDMINE_URL = 'http://your.redmine.com';

// TODO: this should be obtained from a configuration dialog.
var API_ACCESS_KEY = 'YOUR_API_ACCESS_KEY_HERE!';


// HTTP Class
// This prototype is defined for HTTP Basic authentication and easy
// management of HTTP Request
var HTTP = (function() {

  function HTTP() {
    this.default_method = "GET";
    this.base_url = "";
    this.authentication = false;
    this.username = "";
    this.password = "";
  }

  HTTP.prototype.Request = function(url, method) {

    // Support for HTTP Basic Authentication.
    // if (this.authentication) {
    var credentials = Utilities.base64Encode(this.username + ":" + this.password);

    var headers = {
      "Authorization" : credentials
    };

    var options = {
      "headers" : headers,
      "method" : method
    };

    var content = UrlFetchApp.fetch(url, options);

    return content;
  };

  HTTP.prototype.Get = function (url) {
    return this.Request(url, "GET");
  };

  HTTP.prototype.Post = function (url) {
    return this.Request(url, "POST");
  };

  HTTP.prototype.Put = function (url) {
    return this.Request(url, "PUT");
  };

  HTTP.prototype.SetAuth = function (username, password) {
    this.username = username;
    this.password = password;
    this.authentication = true;
  };

  return HTTP;

})();

var Cache = (function() {
  
  function Cache() {
    this.store = {};
  }
  
  Cache.prototype.set = function (key, value) {
    this.store[key] = value;
  }
  
  Cache.prototype.get = function (key) {
    return this.store[key] || undefined;
  }
  
  return Cache;
})();
             
// Class Translator
var Translator = (function() {

  function Translator() {
  }

  // XML to JS Object.
  Translator.prototype.xmlToJS = function (element) {

    //TODO: Refactor this to add an array when necessary, not always.

    var obj = {};

    var element_name = element.getName().getLocalName();
    var element_text = element.getText();

    // element!
    var text = (element_text);
    var name = (element_name);

    obj[name] = {};

    if (text.length > 0) {
      obj[name]["text"] = text;
    }

    var attributes = element.getAttributes();

    if (attributes.length > 0) {
      obj[name]["attributes"] = {};
      for(i = 0; i < attributes.length; i++) {
        obj[name]["attributes"][attributes[i].getName().getLocalName()] = attributes[i].getValue();
      }
    }

    if (typeof(obj[name]["childs"]) == "undefined") {
      obj[name]["childs"] = [];
    }

    var childs = element.getElements();

    for (var i in childs) {
      obj[name]["childs"].push(this.xmlToJS(childs[i]));
    }

    return obj;
  };

  Translator.prototype.searchTag = function (data, tag) {

    var ret_value;

    for (var i in data) {
      if (data[i][tag]) {
        ret_value = data[i][tag];
        break;
      }
    }

    return ret_value;
  };

  return Translator;

})();


var Redmine = (function() {

  function Redmine(base_url, items_by_page) {
    
    this.ITEMS_BY_PAGE = items_by_page || 100;
    this.base_url = base_url || '';
    
    this.http = new HTTP();
    this.http.SetAuth(API_ACCESS_KEY);
    
    this.translator = new Translator();
    
    this.cache = new Cache();
    
    // Privileged methods
    this.paginate = function (url) {
      
      var response = this.http.Get(url);
      var content = response.getContentText();
      
      var xml = Xml.parse(content, true);
      var root = xml.getElement();
      
      var entries = root.getAttribute('total_count').getValue();
      
      var pages = Math.floor((entries / this.ITEMS_BY_PAGE) + 1);
      
      return pages;
    };
    
    this.getDataElement = function (url, root_tag) {
      // TODO: Avoid the use of root_tag and element_tag we can infer it.
      
      if (this.cache.get(url)) {
      
        return this.cache.get(url);
      
      } else {
        
        var data = [];
        
        var xml_content = this.http.Get(url);
        var xml = Xml.parse(xml_content.getContentText(), true);
        
        var root_element = xml.getElement();
        var elements_data = this.translator.xmlToJS(root_element);
        
        var elements = elements_data[root_tag].childs;
        
        this.cache.set(url, elements);
        
        return elements;
      }
    };
    
    this.getData = function (base_url, root_tag, element_tag) {
      
      if (this.cache.get(base_url)) {

        return this.cache.get(base_url);

      } else {
      
        var data = [];
        
        var pages = this.paginate(base_url);
        
        for (var i = 1; i <= pages; i++) {
          
          if (base_url.indexOf("?") > 0)
            var url = base_url + '&limit=' + this.ITEMS_BY_PAGE + '&page=' + i;
          else
            var url = base_url + '?limit=' + this.ITEMS_BY_PAGE + '&page=' + i;
          
          var xml_content = this.http.Get(url);
          var xml = Xml.parse(xml_content.getContentText(), true);
          
          var root_element = xml.getElement();
          var elements_data = this.translator.xmlToJS(root_element);
          
          var elements = elements_data[root_tag].childs;
          
          if (!elements || elements.length == 0) {
            return "Something went wrong";
          }
          
          for (var j in elements) {
            data.push(elements[j][element_tag].childs);
          }
        }
        
        this.cache.set(base_url, data);
        
        return data;
      }
    };
      
  }

  Redmine.prototype.getIssues = function (project_id) {
    Logger.log("Launching getIssues(" + project_id + ")");
    
    var url = REDMINE_URL + '/issues.xml?project_id=' + project_id;
    var data = this.getData(url, 'issues', 'issue');
    
    return data;
  };

  Redmine.prototype.getProjects = function () {
    Logger.log("Launching getProjects()");
    
    var url = REDMINE_URL + '/projects.xml';
    var data = this.getData(url, 'projects', 'project');
    
    return data;
  };

  Redmine.prototype.getProject = function (project_id) {
    Logger.log("Launching getProject(" + project_id + ")");
    
    var url = REDMINE_URL + '/projects/' + project_id + '.xml';
    var data = this.getDataElement(url, 'project');

    return data;
  };

  Redmine.prototype.getTimeEntries = function (project_id) {
    Logger.log("Launching getTimeEntries(" + project_id + ")");
    
    var url = REDMINE_URL + '/projects/' + project_id + '/time_entries.xml';
    var data = this.getData(url, 'time_entries', 'time_entry');

    return data;
  };

  Redmine.prototype.getIssuesByTracker = function (project_id, tracker_id) {
    Logger.log("Launching getIssuesByTracker("+project_id+","+tracker_id+")");
    
    var url = REDMINE_URL + '/issues.xml?project_id=' + project_id + '&tracker_id='+ tracker_id;
    var data = this.getData(url, 'issues', 'issue');
    
    return data;
  };

  Redmine.prototype.issueUpdate = function (issue_id, start_date, due_date) {
    //TODO: Create Issue class for easy handling.
    this.http.SetAuth(API_ACCESS_KEY);

    //TODO: Create Issue to send
    var ret = this.http.Put(REDMINE_URL + '/issues/' + issue_id + '.xml');
  };

  return Redmine;

})();

// CMI related functions
function costProjectByYear(project_id, year) {

  var cost_table = {};
  var total_amount = 0.0;
  var redmine = new Redmine();

  var data = redmine.getTimeEntries(project_id);

  for (var i in data) {

    var spent_on = redmine.translator.searchTag(data[i], 'spent_on');
    var spent_on_text = spent_on.text;

    var te_year = spent_on_text.split('-')[0];

    if (te_year == year) {

      var cost = redmine.translator.searchTag(data[i], 'cost');
      var role = redmine.translator.searchTag(data[i], 'role');
      var cost_value = cost.text;
      var role_text = role.text;

      if (!cost.text)
        continue;

      cost_table[role_text] += +(cost_value);
      total_amount += +(cost_value);
    }
  }

  return total_amount;
}

function expensesProjectByYear(project_id, year) {

  var total_planned = 0.0;
  var total_spent = 0.0;
  var redmine = new Redmine();

  var data = redmine.getIssuesByTracker(project_id, '27');

  for (var i in data) {

    var start_date = redmine.translator.searchTag(data[i], 'start_date');
    var start_date_text = start_date.text;

    var te_year = start_date_text.split('-')[0];

    if (te_year == year) {

      var custom_fields = redmine.translator.searchTag(data[i], 'custom_fields');

      var initial = custom_fields.childs[0].custom_field.childs[0].value.text;
      var planned = custom_fields.childs[1].custom_field.childs[0].value.text;
      var spent = custom_fields.childs[2].custom_field.childs[0].value.text;

      total_planned += +(planned);
      total_spent += +(spent);
    }
  }

  return [total_planned, total_spent];
}
