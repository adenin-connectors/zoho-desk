'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api.getTickets();

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    var dateRange = $.dateRange(activity, "today");

    let filteredTickets = [];
    if (response.body.data) {
      filteredTickets = filterTicketsByDateRange(response.body.data, dateRange);
    }
    let userDesk = activity.Context.connector.custom1;
    let ticketStatus = {
      title: T(activity, 'New Tickets'),
      link: `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`,
      linkLabel: T(activity, 'All Tickets')
    };

    let noOfTickets = filteredTickets.length;

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: noOfTickets > 1 ? T(activity, "You have {0} new tickets.", noOfTickets) : T(activity, "You have 1 new ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(activity, `You have no new tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    $.handleError(activity, error);
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