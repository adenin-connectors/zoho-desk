'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    var pagination = Activity.pagination();

    const response = await api.getTickets(pagination);

    if (Activity.isErrorResponse(response, [204])) return;

    activity.Response.Data = convertResponse(response);
  } catch (error) {
    Activity.handleError(error);
  }
};
//**maps response data to items */
function convertResponse(response) {
  let items = [];
  let data = [];
  if (response.body.data) {
    data = response.body.data;
  }

  for (let i = 0; i < data.length; i++) {
    let raw = data[i];
    let item = { count: data.length, id: raw.id, title: raw.subject, description: raw.status, link: raw.webUrl, raw: raw }
    items.push(item);
  }

  return { items: items };
}