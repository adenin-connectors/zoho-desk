'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    await api.initOrgId();

    const userProfile = await api('/myinfo?include=profile');
    if ($.isErrorResponse(activity, userProfile, [200, 204])) return;

    let allTickets = [];
    let offset = 0;
    let limit = 99;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}&assignee=${userProfile.body.id}` +
      `&sortBy=-createdTime`;
    let response = await api(url);
    if ($.isErrorResponse(activity, response, [200, 204])) return;
    allTickets.push(...response.body.data);

    let hasMore = false;
    if (response.body.data.length == limit) {
      hasMore = true;
    }

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}&assignee=${userProfile.body.id}` +
        `&sortBy=-createdTime`;
      let response = await api(url);
      if ($.isErrorResponse(activity, response)) return;
      allTickets.push(...response.body.data);
      if (response.body.data.length != limit) {
        hasMore = false;
      }
    }

    var dateRange = $.dateRange(activity);
    let tickets = api.filterResponseByDateRange(allTickets, dateRange);
    let value = tickets.length;

    var pagination = $.pagination(activity);
    tickets = api.paginateItems(tickets, pagination);

    activity.Response.Data.items = tickets;
    if (parseInt(pagination.page) == 1) {
      activity.Response.Data.title = T(activity, 'My Open Tickets');
      activity.Response.Data.link = `https://desk.zoho.com/support/${activity.Context.connector.custom1}/ShowHomePage.do#Cases`;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/zoho-desk.svg';
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = tickets[0].date;
        activity.Response.Data.description = value > 1 ? T(activity, "You have {0} tickets assigned.", value)
          : T(activity, "You have 1 ticket assigned.");
        activity.Response.Data.briefing = activity.Response.Data.description + ' The latest is <b>' + tickets[0].title + '</b>';
      } else {
        activity.Response.Data.description = T(activity, `You have no tickets assigned.`);
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};