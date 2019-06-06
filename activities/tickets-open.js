'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    await api.initOrgId();
    let allTickets = [];
    let offset = 0;
    let limit = 99;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}`;
    let response = await api(url);
    if ($.isErrorResponse(activity, response, [200, 204])) return;
    allTickets.push(...response.body.data);

    let hasMore = false;
    if (response.body.data.length == limit) {
      hasMore = true;
    }

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}`;
      let response = await api(url);
      if ($.isErrorResponse(activity, response)) return;
      allTickets.push(...response.body.data);
      if (response.body.data.length != limit) {
        hasMore = false;
      }
    }

    var dateRange = $.dateRange(activity, "today");
    let tickets = api.filterResponseByDateRange(allTickets, dateRange);
    let value = tickets.length;

    var pagination = $.pagination(activity);
    tickets = api.paginateItems(tickets, pagination);

    activity.Response.Data.items = tickets;
    activity.Response.Data.title = T(activity, 'Open Tickets');
    activity.Response.Data.link = `https://desk.zoho.com/support/${activity.Context.connector.custom1}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      activity.Response.Data.value = value;
      activity.Response.Data.color = 'blue';
      activity.Response.Data.description = value > 1 ? T(activity, "You have {0} tickets.", value)
        : T(activity, "You have 1 ticket.");
    } else {
      activity.Response.Data.description = T(activity, `You have no tickets.`);
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};