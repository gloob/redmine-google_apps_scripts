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
