'use strict';

const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    await api.initOrgId();

    const limit = 99;

    let offset = 0;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

    let response = await api(url);

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    const allTickets = [];

    allTickets.push(...response.body.data);

    let hasMore = false;

    if (response.body.data.length === limit) hasMore = true;

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

      response = await api(url);

      if ($.isErrorResponse(activity, response)) return;

      allTickets.push(...response.body.data);

      if (response.body.data.length !== limit) hasMore = false;
    }

    const dateRange = $.dateRange(activity);

    // this function also maps raw response -> item structure
    let tickets = api.filterResponseByDateRange(allTickets, dateRange, true);
    let count = 0;
    let readDate = (new Date(new Date().setDate(new Date().getDate() - 30))).toISOString(); // default read date 30 days in the past

    if (activity.Request.Query.readDate) readDate = activity.Request.Query.readDate;

    let hasUnread = false;

    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].isRead && !hasUnread) {
        readDate = tickets[i].date;
      } else if (!tickets[i].isRead) {
        hasUnread = true;
      }
    }

    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].date > readDate) {
        tickets[i].isNew = true;
        count++;
      }
    }

    const pagination = $.pagination(activity);

    tickets = api.paginateItems(tickets, pagination);

    activity.Response.Data.items = tickets;

    if (parseInt(pagination.page) === 1) {
      activity.Response.Data.title = T(activity, 'New Tickets');
      activity.Response.Data.link = `${api.getInstanceDomain()}/ShowHomePage.do#Cases`;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/zoho-desk.svg';
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = count > 0;

      if (count > 0) {
        const first = tickets[0];

        activity.Response.Data.value = count;
        activity.Response.Data.date = first.date;
        activity.Response.Data.description = count > 1 ? T(activity, 'You have {0} new tickets.', count) : T(activity, 'You have 1 new ticket.');

        let fallbackToDefault = false;

        // For the briefing message we first try company name, then creator's name, then creator's email, before falling back to default
        if (first.contact.account) {
          activity.Response.Data.briefing = first.contact.account.accountName;
        } else if (first.contact.firstName && first.contact.lastName) {
          activity.Response.Data.briefing = `${first.contact.firstName} ${first.contact.lastName}`;
        } else if (first.contact.email) {
          activity.Response.Data.briefing = first.contact.email;
        } else {
          // default is we append latest ticket name to the existing ticket count message
          activity.Response.Data.briefing = activity.Response.Data.description + ` The latest is <strong>${first.title}</strong>`;
          fallbackToDefault = true;
        }

        // if we aren't using default message, we add the rest of the text that is common to briefing message here
        if (!fallbackToDefault) {
          activity.Response.Data.briefing += ` has a new ticket for <b>${first.title}</b>`;

          // if there's more than one ticket we add 'and X more', then must check if there's more than two tickets (to decide whether to use plural)
          if (count > 1) activity.Response.Data.briefing += count > 2 ? `, along with ${count - 1} more new tickets` : ', along with 1 more new ticket';
        }
      } else {
        activity.Response.Data.description = T(activity, 'You have no new tickets.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
