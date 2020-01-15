'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var pagination = $.pagination(activity);
    const response = await api.getTickets(pagination);

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    activity.Response.Data.items = filterUnassignedTickets(response);
    activity.Response.Data.title = T(activity, 'Unassigned Tickets');
    activity.Response.Data.link = `${api.getInstanceDomain()}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};

function filterUnassignedTickets(response) {
  let items = [];
  let data = [];
  if (response.body.data) {
    data = response.body.data;
  }

  for (let i = 0; i < data.length; i++) {
    let raw = data[i];

    if (!raw.assigneeId) {
      let item = {
        id: raw.id,
        title: raw.subject,
        description: raw.status,
        date: raw.createdTime,
        link: raw.webUrl,
        raw: raw
      };

      items.push(item);
    }
  }

  return items;
};