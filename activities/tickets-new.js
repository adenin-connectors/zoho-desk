'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    await api.initOrgId();

    const promises = [];
    const limit = 99;

    let offset = 0;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

    promises.push(api.initOrgId());
    promises.push(api(url));

    const responses = await Promise.all(promises);

    if ($.isErrorResponse(activity, responses[1], [200, 204])) return;

    const response = responses[1];
    const allTickets = [];

    allTickets.push(...response.body.data);

    let hasMore = false;

    if (response.body.data.length === limit) hasMore = true;

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

      const response = await api(url);

      if ($.isErrorResponse(activity, response)) return;

      allTickets.push(...response.body.data);

      if (response.body.data.length !== limit) hasMore = false;
    }

    const dateRange = $.dateRange(activity);

    let tickets = api.filterResponseByDateRange(allTickets, dateRange);
    let count = 0;
    let readDate = (new Date(new Date().setDate(new Date().getDate() - 30))).toISOString(); // default read date 30 days in the past

    if (activity.Request.Query.readDate) readDate = activity.Request.Query.readDate;

    let hasUnread = false;

    for (let i = tickets.length - 1; i >= 0; i--) {
      if (tickets[i].raw.isRead && !hasUnread) {
        readDate = tickets[i].date;
      } else if (!tickets[i].raw.isRead) {
        hasUnread = true;
      }
    }

    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].date > readDate) count++;
    }

    const pagination = $.pagination(activity);

    tickets = api.paginateItems(tickets, pagination);

    activity.Response.Data.items = tickets;

    if (parseInt(pagination.page) === 1) {
      activity.Response.Data.title = T(activity, 'New Tickets');
      activity.Response.Data.link = `https://desk.zoho.com/support/${activity.Context.connector.custom1}/ShowHomePage.do#Cases`;
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = count > 0;

      if (count > 0) {
        activity.Response.Data.value = count;
        activity.Response.Data.date = tickets[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = count > 1 ? T(activity, 'You have {0} new tickets.', count) : T(activity, 'You have 1 new ticket.');
      } else {
        activity.Response.Data.description = T(activity, 'You have no new tickets.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};