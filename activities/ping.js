'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    //'/ticketsCount' returns error 500 bit in my opinion is fastest request
    const response = await api('/organizations');

    activity.Response.Data = {
      success: response && response.statusCode === 200
    };
  } catch (error) {
    cfActivity.handleError(activity, error);
    activity.Response.Data.success = false;
  }
};
