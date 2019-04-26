'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const userId = await api.getCurrentUserId();
    const response = await api.getTickets(null, userId);
    if ($.isErrorResponse(activity, response, [200, 204])) return;

    let userDesk = activity.Context.connector.custom1;
    let status = {
      title: T(activity, 'My Open Tickets'),
      link: `https://desk.zoho.com/support/${userDesk}/ShowHomePage.do#Cases`,
      linkLabel: T(activity, 'All Tickets')
    };

    let value = 0;
    if (response.body.data) {
      value = response.body.data.length;
    }

    if (value != 0) {
      status = {
        ...status,
        description: value > 1 ? T(activity, "You have {0} tickets assigned.", value)
          : T(activity, "You have 1 ticket asigned."),
        color: 'blue',
        value: value,
        actionable: true
      };
    } else {
      status = {
        ...status,
        description: T(activity, `You have no tickets assigned.`),
        actionable: false
      };
    }

    activity.Response.Data = status;
  } catch (error) {
    $.handleError(activity, error);
  }
};
