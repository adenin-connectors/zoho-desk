const api = require('./common/api');


module.exports = async function (activity) {
  try {
    api.initialize(activity);
    const orgRequestResponse = await api('/organizations');
    api.getOrgId(orgRequestResponse);

    const response = await api('/tickets?include=contacts,assignee,departments,team,isRead');

    // convert response to items[]
    activity.Response.Data = api.convertIssues(response);

  } catch (error) {

    // return error response
    var m = error.message;
    if (error.stack) m = m + ": " + error.stack;

    activity.Response.ErrorCode = (error.response && error.response.statusCode) || 500;
    activity.Response.Data = { ErrorText: m };

  }

};



