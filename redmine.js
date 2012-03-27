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
    this.translator = new Translator();
  }

  Redmine.prototype.getReports = function (project_id) {
    return "";
  };

  Redmine.prototype.getProjects = function () {

    Logger.log("Launching getProjects()");

    this.http.SetAuth(API_ACCESS_KEY);

    var xml_content = this.http.Get(REDMINE_URL + '/projects.xml');
    var xml = Xml.parse(xml_content.getContentText(), true);

    var root_element = xml.getElement();
    var projects_data = this.translator.xmlToJS(root_element);

    var projects = projects_data.projects.childs;

    if (!projects || projects.length == 0) {
      return "Something went wrong";
    }

    var data = [];

    for (var i in projects) {
      //Logger.log(projects[i].project.childs);
      var length = projects[i].project.childs.length;
      Logger.log(length);
      var id = projects[i].project.childs[0].id.text;
      var name = projects[i].project.childs[1].name.text;
      var description = projects[i].project.childs[3].description.text;
      var createdon = projects[i].project.childs[length - 2].created_on.text;
      var updatedon = projects[i].project.childs[length - 1].updated_on.text;

      var obj = {};

      obj["id"] = id;
      obj["projectName"] = name;
      obj["description"] = description;
      obj["createdOn"] = createdon;
      obj["updatedOn"] = updatedon;
      Logger.log(obj);
      data.push(obj);
    }

    return data;
  };

  Redmine.prototype.getProject = function (id) {

    Logger.log("Launching getProject()"+id);

    this.http.SetAuth(API_ACCESS_KEY);

    var xml_content = this.http.Get(REDMINE_URL + '/projects/' + id + '.xml');
    var xml = Xml.parse(xml_content.getContentText(), true);

    var root_element = xml.getElement();
    var project_data = this.translator.xmlToJS(root_element);

    var project = project_data.project.childs;

    if (!project || project.length == 0) {
      return "Something went wrong";
    }

    var data = [];

    Logger.log(project[5].custom_fields.childs[9].custom_field.text);

    return data;
  };

  Redmine.prototype.getTimeEntries = function (project_id) {
    Logger.log("Launching getTimeEntries("+project_id+")");

    this.http.SetAuth(API_ACCESS_KEY);

    var xml_content = this.http.Get(REDMINE_URL + '/projects/' + project_id +
                               '/time_entries.xml');

    var xml = Xml.parse(xml_content.getContentText(), true);

    var time_entries_count = xml.time_entries.getAttribute('total_count').getValue();

    var pages = (time_entries_count / this.ITEMS_BY_PAGE) + 1;

    var data = [];

    for (var i = 1; i <= pages; i++) {

      xml_content = this.http.Get(REDMINE_URL + '/projects/' + project_id +
                             '/time_entries.xml?limit='+ this.ITEMS_BY_PAGE +
                             '&page=' + i);

      xml = Xml.parse(xml_content.getContentText(), true);

      var root_element = xml.getElement();
      var time_data = this.translator.xmlToJS(root_element);
      var time_entries = time_data.time_entries.childs;

      if (!time_entries || time_entries.length == 0) {
        return "Something went wrong";
      }

      for (var j in time_entries) {
        data.push(time_entries[j].time_entry.childs);
      }
    }

    return data;
  };

  Redmine.prototype.getIssuesByTracker = function (project_id, tracker_id) {
    Logger.log("Launching getIssuesByTracker("+project_id+","+tracker_id+")");

    this.http.SetAuth(API_ACCESS_KEY);

    var xml_content = this.http.Get(REDMINE_URL + '/issues.xml?project_id=' + project_id +
                               '&tracker_id='+ tracker_id);

    var xml = Xml.parse(xml_content.getContentText(), true);

    var issues_count = xml.issues.getAttribute('total_count').getValue();

    var pages = (issues_count / this.ITEMS_BY_PAGE) + 1;

    var data = [];

    for (var i = 1; i <= pages; i++) {

      xml_content = this.http.Get(REDMINE_URL + '/issues.xml?project_id=' + project_id +
                             '&tracker_id='+ tracker_id +
                             '&limit='+ this.ITEMS_BY_PAGE + '&page=' + i);

      xml = Xml.parse(xml_content.getContentText(), true);

      var root_element = xml.getElement();
      var issue_data = this.translator.xmlToJS(root_element);

      var issues = issue_data.issues.childs;
      Logger.log(issues);

      if (!issues || issues.length == 0) {
        return [];
      }

      for (var j in issues) {
        Logger.log(issues[j]);
        data.push(issues[j].issue.childs);
      }
    }

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
