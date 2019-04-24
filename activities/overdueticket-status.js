'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    let dateRange = $.dateRange(activity,"today");
    let endDate = new Date(dateRange.startDate);
    await api.initOrgId();

    //gets all open tickets where customer replied over 24 hrs ago and ticket was modified 24 hours ago
    let url = `/tickets/search?modifiedTimeRange=${new Date(0).toISOString()},${endDate.toISOString()}` +
      `&customerResponseTimeRange=${new Date(0).toISOString()},${endDate.toISOString()}&status=open`;
    const response = await api(url);

    if ($.isErrorResponse(activity,response, [200, 204])) return;

    let userDesk = activity.Context.connector.custom1;
    let ticketStatus = {
      title: T(activity,'Overdue Tickets'),
      link: `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`,
      linkLabel: T(activity,'All Tickets')
    };

    let noOfTickets = 0;
    if (response.body.data) {
      noOfTickets = response.body.data.length;
    }

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: noOfTickets > 1 ? T(activity,"You have overdue {0} tickets.", noOfTickets) : T(activity,"You have overdue 1 ticket."),
        color: 'blue',
        value: noOfTickets,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(activity,`You have no overdue tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    $.handleError(activity,error);
  }
};