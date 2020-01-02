'use strict';

const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    await api.initOrgId();

    const limit = 99;

    let offset = 0;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}&sortBy=-createdTime`;

    let response = await api(url);

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    const allTickets = [];

    allTickets.push(...response.body.data);

    let hasMore = false;

    if (response.body.data.length === limit) hasMore = true;

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&status=open&from=${offset}&limit=${limit}&sortBy=-createdTime`;

      response = await api(url);

      if ($.isErrorResponse(activity, response)) return;

      allTickets.push(...response.body.data);

      if (response.body.data.length !== limit) hasMore = false;
    }

    const dateRange = $.dateRange(activity);

    // this function also maps raw response -> item structure
    let tickets = api.filterResponseByDateRange(allTickets, dateRange);
    const value = tickets.length;

    const pagination = $.pagination(activity);

    tickets = api.paginateItems(tickets, pagination);

    activity.Response.Data.items = tickets;

    if (parseInt(pagination.page) === 1) {
      activity.Response.Data.title = T(activity, 'Open Tickets');
      activity.Response.Data.link = `https://desk.zoho.com/support/${activity.Context.connector.custom1}/ShowHomePage.do#Cases`;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/zoho-desk.svg';
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        const first = tickets[0];

        activity.Response.Data.value = value;
        activity.Response.Data.date = first.date;
        activity.Response.Data.description = value > 1 ? T(activity, 'You have {0} open tickets.', value) : T(activity, 'You have 1 open ticket.');

        let fallbackToDefault = false;

        // For the briefing message we first try company name, then creator's name, then creator's email, before falling back to default
        if (first.contact.account) {
          activity.Response.Data.briefing = first.contact.account.accountName;
        } else if (first.contact.firstName && first.contact.lastName) {
          activity.Response.Data.briefing = `${first.contact.firstName} ${first.contact.firstName}`;
        } else if (first.contact.email) {
          activity.Response.Data.briefing = first.contact.email;
        } else {
          // default is we append latest ticket name to the existing ticket count message
          activity.Response.Data.briefing = activity.Response.Data.description + ` The latest is <strong>${first.title}</strong>`;
          fallbackToDefault = true;
        }

        // if we aren't using default message, we add the rest of the text that is common to briefing message here
        if (!fallbackToDefault) {
          activity.Response.Data.briefing += ` has an open ticket for <b>${first.title}</b>`;

          // if there's more than one ticket we add 'and X more', then must check if there's more than two tickets (to decide whether to use plural)
          if (value > 1) activity.Response.Data.briefing += value > 2 ? `, along with ${value - 1} more open tickets` : ', along with 1 more open ticket';
        }
      } else {
        activity.Response.Data.description = T(activity, 'You have no open tickets.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
