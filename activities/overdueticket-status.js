'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api.getOverdueTickets();

    if (Activity.isErrorResponse(response, [200, 204])) return;

    let ticketStatus = {
      title: T('Overdue Tickets'),
      link: 'https://desk.zoho.com/support/devhome/ShowHomePage.do#Cases',
      linkLabel: T('All Tickets')
    };

    let noOfTickets = 0;
    if (response.body.data) {
      noOfTickets = response.body.data.length;
    }

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: noOfTickets > 1 ? T("You have overdue {0} tickets.", noOfTickets) : T("You have overdue 1 ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(`You have no overdue tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};
