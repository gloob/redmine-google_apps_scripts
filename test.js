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

// Some useful constants
var PROJECT_ID = 'your_project_id';
PROJECT_ID = 'guadalinex-puntos-empleo-sae';
var TRACKER_ID = 'your_tracker_id';

// Redmine class tests

function redmine_getIssues() {
  var redmine = new Redmine();
  var issues = redmine.getIssues(PROJECT_ID);
  
  Logger.log('Issues: ' + issues.length);
  Logger.log(issues);
}

function redmine_getProjects() {
  var redmine = new Redmine();
  var projects = redmine.getProjects();
  
  Logger.log('Projects: ' + projects.length);
  Logger.log(projects);
}

function redmine_getProject() {
  var redmine = new Redmine();
  var project = redmine.getProject(PROJECT_ID);
  
  Logger.log(project);
}

function redmine_getTimeEntries() {
  var redmine = new Redmine();
  var time_entries = redmine.getTimeEntries(PROJECT_ID);
  
  Logger.log('Time entries: ' + time_entries.length);
  Logger.log(time_entries);
}

function redmine_getIssuesByTracker() {
  var redmine = new Redmine();
  var issues = redmine.getIssuesByTracker(PROJECT_ID, TRACKER_ID);
  
  Logger.log('Issues: ' + issues.length);
  Logger.log(issues);
}

function redmine_issueUpdate() {
  var redmine = new Redmine();
}
