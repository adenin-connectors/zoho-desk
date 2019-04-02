'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initOrgId();
    let dateRange = Activity.dateRange("today");
    let endDate = new Date(dateRange.startDate);
    await api.initOrgId();

    //gets all open tickets where customer replied over 24 hrs ago and ticket was modified 24 hours ago
    let url = `/tickets/search?modifiedTimeRange=${new Date(0).toISOString()},${endDate.toISOString()}` +
      `&customerResponseTimeRange=${new Date(0).toISOString()},${endDate.toISOString()}&status=open`;
    const response = await api(url);

    if (Activity.isErrorResponse(response, [200, 204])) return;

    let userDesk = Activity.Context.connector.custom1;
    let ticketStatus = {
      title: T('Overdue Tickets'),
      link: `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`,
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