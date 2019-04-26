'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api.getTickets();

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    var dateRange = $.dateRange(activity, "today");

    const userDesk = activity.Context.connector.custom1;

    activity.Response.Data.items = api.filterResponseByDateRange(response, dateRange);
    activity.Response.Data.title = T(activity, 'New Tickets');
    activity.Response.Data.link = `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};