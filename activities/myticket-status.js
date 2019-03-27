'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api.getTickets();

    if (Activity.isErrorResponse(response, [204])) return;

    let ticketStatus = {
      title: T('Open Tickets'),
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
        description: noOfTickets > 1 ? T("You have {0} tickets.", noOfTickets) : T("You have 1 ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(`You have no tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};
