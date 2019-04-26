'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var pagination = $.pagination(activity);
    const response = await api.getTickets(pagination);

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    let userDesk = activity.Context.connector.custom1;

    activity.Response.Data.items = api.convertResponse(response);
    activity.Response.Data.title = T(activity, 'Open Tickets');
    activity.Response.Data.link = `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};