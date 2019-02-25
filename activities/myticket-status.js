'use strict';

const logger = require('@adenin/cf-logger');
const handleError = require('@adenin/cf-activity').handleError;
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api.getTickets();

    let ticketStatus = {
      title: 'Open Tickets',
      url: 'https://desk.zoho.com/support/devhome/ShowHomePage.do#Cases',
      urlLabel: 'All tickets',
    };

    let noOfTickets = response.body.data.length;

    if (noOfTickets != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: `You have ${noOfTickets > 1 ? noOfTickets + " tickets" : noOfTickets + " ticket"} assigned`,
        color: 'blue',
        value: noOfTickets,
        actionable: true
      }
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: `You have no tickets assigned`,
        actionable: false
      }
    }

    activity.Response.Data = ticketStatus;

  } catch (error) {
    handleError(error, activity);
  }
};
