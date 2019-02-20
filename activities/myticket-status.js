'use strict';

const logger = require('@adenin/cf-logger');
const handleError = require('@adenin/cf-activity').handleError;
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const orgRequestResponse = await api('/organizations');
    api.getOrgId(orgRequestResponse);

    const response = await api('/tickets?include=contacts,assignee,departments,team,isRead');

    let ticketStatus = {
      title: 'Open Tickets',
      url: orgRequestResponse.body.data[0].portalURL,
      urlLabel: 'All tickets',
    };

    let noOfTickets = response.body.data.length;

    if (noOfTickets != 0) {
      ticketStatus = {
        description: `You have ${noOfTickets} tickets assigned`,
        color: 'blue',
        value: noOfTickets,
        actionable: true
      }
    } else {
      ticketStatus = {
        description: `You have no tickets assigned`,
        actionable: false
      }
    }

    activity.Response.Data = ticketStatus;

  } catch (error) {
    handleError(error, activity);
  }
};
