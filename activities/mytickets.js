'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var pagination = cfActivity.pagination(activity);

    const response = await api.getTickets(pagination);
    
    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }
    
    activity.Response.Data = convertResponse(response);
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};
//**maps response data to items */
function convertResponse (response) {
  let items = [];
  let data = response.body.data;

  for (let i = 0; i < data.length; i++) {
    let raw = data[i];
    let item = {count:data.length, id: raw.id, title: raw.subject, description: raw.status, link: raw.webUrl, raw: raw }
    items.push(item);
  }

  return { items: items };
}