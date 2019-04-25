'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api.getTickets();

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    let userDesk = activity.Context.connector.custom1;
    let ticketStatus = {
      title: T(activity, 'Open Tickets'),
      link: `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`,
      linkLabel: T(activity, 'All Tickets')
    };

    let noOfTickets = 0;
    if (response.body.data) {
      noOfTickets = response.body.data.length;
    }

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: noOfTickets > 1 ? T(activity, "You have {0} tickets.", noOfTickets) : T(activity, "You have 1 ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(activity, `You have no tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};
