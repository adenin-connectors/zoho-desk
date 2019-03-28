'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api.getTickets();

    if (Activity.isErrorResponse(response, [200, 204])) return;

    var dateRange = Activity.dateRange("today");

    let filteredTickets = [];
    if (response.body.data) {
      filteredTickets = filterTicketsByDateRange(response.body.data, dateRange);
    }

    let ticketStatus = {
      title: T('New Tickets'),
      link: 'https://desk.zoho.com/support/devhome/ShowHomePage.do#Cases',
      linkLabel: T('All Tickets')
    };

    let noOfTickets = filteredTickets.length;

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: noOfTickets > 1 ? T("You have {0} new tickets.", noOfTickets) : T("You have 1 new ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(`You have no new tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    Activity.handleError(error);
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