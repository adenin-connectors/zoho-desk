'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let query = activity.Request.Query.query;
    if (query.length < 2) {
      let items = [];
      activity.Response.Data.items = items;
      return;
    }

    var pagination = Activity.pagination();
    const pageSize = parseInt(pagination.pageSize, 10);
    const offset = parseInt(pagination.page) * pageSize;

    let dateRange = Activity.dateRange("today");
    let startDate = new Date(dateRange.startDate);
    let endDate = new Date(dateRange.endDate);

    await api.initOrgId();

    let url = `/tickets/search?limit=${pageSize}&from=${offset}&modifiedTimeRange=${startDate.toISOString()},${endDate.toISOString()}`
      + `&subject=${query}`;

    const response = await api(url);
    if (Activity.isErrorResponse(response, [200, 204])) return;

    activity.Response.Data = api.convertResponse(response);
  } catch (error) {
    Activity.handleError(error);
  }
};