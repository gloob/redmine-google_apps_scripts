// Copyright 2010 Emergya All Rights Reserved.
// Author: Alejandro Leiva <aleiva@emergya.es>

var REDMINE_URL = 'http://redmine.emergya.es';

// TODO: this should be obtained from a configuration dialog.
var API_ACCESS_KEY = 'YOUR_API_ACCESS_KEY_HERE!';


// HTTP Class
// This prototype is defined for HTTP Basic authentication and easy
// management of HTTP Request
var HTTP = {
  
  default_method: "GET",
  base_url: "",
  authentication: false,
  username: "",
  password: "",
  
  Request: function(url, method) {

    // Support for HTTP Basic Authentication.
    // if (this.authentication) {
    var credentials = Utilities.base64Encode(this.username + ":" + this.password);
  
    var headers = {
      "Authorization" : credentials
    };
  
    options = {
      "headers" : headers,
      "method" : method
    };
    
    var content = UrlFetchApp.fetch(url, options);
    
    return content;
  },
  
  Get: function (url) {
    return this.Request(url, "GET");
  },

  Post: function (url) {
    return this.Request(url, "POST");
  },
  
  Put: function (url) {
    return this.Request(url, "PUT");
  },
  
  SetAuth: function (username, password) {
    this.username = username;
    this.password = password;
    this.authentication = true;
  }

}

    
// Class Translator
var Translator = {
  
  // XML to JS Object.
  xmlToJS: function (element) {
    
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
  }
};


var Redmine = {
  
  ITEMS_BY_PAGE: 100,
  base_url: '',
  
  getReports: function (project_id) {
    return "";
  },

  getProjects: function () {

    Logger.log("Launching getProjects()");

    HTTP.SetAuth(API_ACCESS_KEY);

    var xml_content = HTTP.Get(REDMINE_URL + '/projects.xml');
    var xml = Xml.parse(xml_content.getContentText(), true);

    var root_element = xml.getElement();
    var projects_data = Translator.xmlToJS(root_element);

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
  },

  getProject: function (id) {

    Logger.log("Launching getProject()"+id);

    HTTP.SetAuth(API_ACCESS_KEY);

    var xml_content = HTTP.Get(REDMINE_URL + '/projects/' + id + '.xml');
    var xml = Xml.parse(xml_content.getContentText(), true);

    var root_element = xml.getElement();
    var project_data = Translator.xmlToJS(root_element);

    var project = project_data.project.childs;

    if (!project || project.length == 0) {
      return "Something went wrong";
    }

    var data = [];
 
    Logger.log(project[5].custom_fields.childs[9].custom_field.text);

    //for (var i in project) {
    //  Logger.log(project[i]);
    //}
      //Logger.log(projects[i].project.childs);
    //  var length = projects[i].project.childs.length;
    //  Logger.log(length);
    //  var id = projects[i].project.childs[0].id.text;
    //  var name = projects[i].project.childs[1].name.text;
    //  var description = projects[i].project.childs[3].description.text;
    //  var createdon = projects[i].project.childs[length - 2].created_on.text;
    //  var updatedon = projects[i].project.childs[length - 1].updated_on.text;
  
    //  var obj = {};
    
    //  obj["id"] = id;
    //  obj["projectName"] = name;
    //  obj["description"] = description;
    //  obj["createdOn"] = createdon;
    //  obj["updatedOn"] = updatedon;
    //  Logger.log(obj);
    //  data.push(obj);
    //}
  
    return data;
  },
  
  getTimeEntries: function (project_id) {
    Logger.log("Launching getTimeEntries("+project_id+")");

    HTTP.SetAuth(API_ACCESS_KEY);

    var xml_content = HTTP.Get(REDMINE_URL + '/projects/' + project_id +
                               '/time_entries.xml');

    var xml = Xml.parse(xml_content.getContentText(), true);

    var time_entries_count = xml.time_entries.getAttribute('total_count').getValue();

    var pages = (time_entries_count / Redmine.ITEMS_BY_PAGE) + 1;

    var data = [];

    for (var i = 1; i <= pages; i++) {

      xml_content = HTTP.Get(REDMINE_URL + '/projects/' + project_id +
                             '/time_entries.xml?limit='+ Redmine.ITEMS_BY_PAGE +
                             '&page=' + i);

      xml = Xml.parse(xml_content.getContentText(), true);

      var root_element = xml.getElement();
      var time_data = Translator.xmlToJS(root_element);
      var time_entries = time_data.time_entries.childs;

      if (!time_entries || time_entries.length == 0) {
        return "Something went wrong";
      }

      for (var j in time_entries) {
        data.push(time_entries[j].time_entry.childs);
      }
    }

    return data;
  },

  issueUpdate: function (issue_id, start_date, due_date) {
    //TODO: Create Issue class for easy handling.
    HTTP.SetAuth(API_ACCESS_KEY);

    //TODO: Create Issue to send.
    var ret = HTTP.Put(REDMINE_URL + '/issues/' + issue_id + '.xml');

  }
};

// CMI related functions
function costProjectByYear(project_id, year) {

  var cost_table = {};
  var total_amount = 0.0;

  var data = Redmine.getTimeEntries(project_id);

  for (var i in data) {

    var spent_on = data[i][7].spent_on.text;
    var te_year = spent_on.split('-')[0];

    if (te_year == year) {
      var cost = +(data[i][8].cost.text);
      var role = data[i][9].role.text;

      cost_table[role] += cost;
      total_amount += cost;
    }
  }

  return total_amount;
}


// Presentation functions

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeString(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns an Array of normalized Strings. 
// Empty Strings are returned for all Strings that could not be successfully normalized.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeStrings(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    keys.push(normalizeString(headers[i]));
  }
  return keys;
}

// setRowsData fills in one row of data per object defined in the objects Array.
// For every Column, it checks if data objects define a value for it.
// Arguments:
//   - sheet: the Sheet Object where the data will be written
//   - objects: an Array of Objects, each of which contains data for a row
//   - optHeadersRange: a Range of cells where the column headers are defined. This
//     defaults to the entire first row in sheet.
//   - optFirstDataRowIndex: index of the first row where data should be written. This
//     defaults to the row immediately below the headers.
function setRowsData(sheet, objects, optHeadersRange, optFirstDataRowIndex) {
  
  var headersRange = optHeadersRange || sheet.getRange(1, 1, 1, sheet.getMaxColumns());
  var firstDataRowIndex = optFirstDataRowIndex || headersRange.getRowIndex() + 1;
  var headers = normalizeStrings(headersRange.getValues()[0]);

  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < headers.length; ++j) {
      var header = headers[j];
      values.push(header.length > 0 && objects[i][header] ? objects[i][header] : "");
    }
    data.push(values);
  }

  var destinationRange = sheet.getRange(firstDataRowIndex, headersRange.getColumnIndex(), 
                                        objects.length, headers.length);
  destinationRange.setValues(data);
}

function populateProjectsSS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectsSheet = ss.getSheetByName('ProjectsData') || ss.insertSheet('ProjectsData', ss.getSheets().length);
  projectsSheet.clear();

  var columnNames = ["Id", "Project Name", "Description", "Created On", "Updated On"];
  var headersRange = projectsSheet.getRange(1, 1, 1, columnNames.length);

  headersRange.setValues([columnNames]);
  
  var data = Redmine.getProjects();
  
  setRowsData(projectsSheet, data);
}

// Stub functions
function getProject() {
  var data = Redmine.getProject(203);
}

function getCostFor2011() {
  var total_amount = costProjectByYear(189, '2011');
  Logger.log("total_amount: " + total_amount);
}
