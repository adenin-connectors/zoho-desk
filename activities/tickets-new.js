'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api.getTickets();

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    var dateRange = cfActivity.dateRange(activity, "today");
    let filteredTickets = filterTicketsByDateRange(response.body.data, dateRange);

    let ticketStatus = {
      title: 'New Tickets',
      url: 'https://desk.zoho.com/support/devhome/ShowHomePage.do#Cases',
      urlLabel: 'All tickets',
    };

    let noOfTickets = filteredTickets.length;

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: `You have ${noOfTickets > 1 ? noOfTickets + " new tickets" : noOfTickets + " new ticket"} assigned`,
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: `You have no new tickets assigned`,
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};

//**filters tickets based on provided dateRange */
function filterTicketsByDateRange(tickets, dateRange) {
  let filteredTickets = [];
  let timeMin = new Date(dateRange.startDate).valueOf();
  let timeMax = new Date(dateRange.endDate).valueOf();

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    let createTime = new Date(ticket.createdTime).valueOf();

    if (createTime > timeMin && createTime < timeMax) {
      filteredTickets.push(ticket);
    }
  }

  return filteredTickets;
}