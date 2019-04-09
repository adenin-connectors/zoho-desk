'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    var pagination = Activity.pagination();
    const response = await api.getTickets(pagination);

    if (Activity.isErrorResponse(response, [200, 204])) return;

    activity.Response.Data = api.convertResponse(response);
  } catch (error) {
    Activity.handleError(error);
  }
};