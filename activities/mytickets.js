'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var pagination = $.pagination(activity);
    const userId = await api.getCurrentUserId();
    const response = await api.getTickets(pagination, userId);
    if ($.isErrorResponse(activity, response, [200, 204])) return;

    var dateRange = $.dateRange(activity, "today");
    activity.Response.Data.items = api.filterResponseByDateRange(response, dateRange);
    let value = activity.Response.Data.items.items.length;
    activity.Response.Data.title = T(activity, 'My Open Tickets');
    activity.Response.Data.link = `https://desk.zoho.com/support/${activity.Context.connector.custom1}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      activity.Response.Data.value = value;
      activity.Response.Data.color = 'blue';
      activity.Response.Data.description = value > 1 ? T(activity, "You have {0} tickets assigned.", value)
        : T(activity, "You have 1 ticket asigned.");
    } else {
      activity.Response.Data.description = T(activity, `You have no tickets assigned.`);
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};