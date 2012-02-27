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

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menu_entries = [{name: "Costs 2011", functionName: "YearCost2011"},
                      {name: "Costs 2012", functionName: "YearCost2012"},
                      {name: "Expenses 2011", functionName: "YearExpenses2011"},
                      {name: "Expenses 2012", functionName: "YearExpenses2012"}];
  ss.addMenu("Costs", menu_entries);
}

function YearCost2011 () {
  YearCost('2011');
}

function YearCost2012 () {
  YearCost('2012');
}

function YearCost(year) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 0; i < data.length; ++i) {
    var row = data[i];
    var project_id = row[0];
    if (project_id != '') {
      var total_amount = costProjectByYear(project_id, year);
      sheet.getRange(i+1, 2).setValue(total_amount);
    }
  }

  Browser.msgBox("Done! costs calculation.");
}

function YearExpenses2011 () {
  YearExpenses ('2011');
}

function YearExpenses2012 () {
  YearExpenses ('2012');
}

function YearExpenses (year) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 0; i < data.length; ++i) {
    var row = data[i];
    var project_id = row[0];
    if (project_id != '') {
      var expenses = expensesProjectByYear(project_id, year);
      sheet.getRange(i+1, 3).setValue(expenses[0]);
      sheet.getRange(i+1, 4).setValue(expenses[1]);
    }
  }

  Browser.msgBox("Done! expenses calculation");
}
