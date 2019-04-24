'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    if (!activity.Request.Query.query) activity.Request.Query.query = "";
    let query = activity.Request.Query.query;
    if (query.length < 3) {
      let items = [];
      activity.Response.Data.items = items;
      return;
    }

    var pagination = $.pagination(activity);
    const pageSize = parseInt(pagination.pageSize, 10);
    const offset = parseInt(pagination.page-1) * pageSize;

    let dateRange = $.dateRange(activity, "today");
    let startDate = new Date(dateRange.startDate);
    let endDate = new Date(dateRange.endDate);

    api.initialize(activity);
    await api.initOrgId();

    let url = `/tickets/search?limit=${pageSize}&from=${offset}&modifiedTimeRange=${startDate.toISOString()},${endDate.toISOString()}`
      + `&subject=${query}`;

    const response = await api(url);
    if ($.isErrorResponse(activity, response, [200, 204])) return;

    activity.Response.Data = api.convertResponse(response);
  } catch (error) {
    $.handleError(activity, error);
  }
};