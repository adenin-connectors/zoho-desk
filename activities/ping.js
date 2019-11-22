'use strict';

const api = require('./common/api');

module.exports = async (activity) => {
  try {
    //'/ticketsCount' returns error 500 bit in my opinion is fastest request
    api.initialize(activity);

    await api.initOrgId();

    const response = await api('/organizations');

    activity.Response.Data = {
      success: response && response.statusCode === 200
    };
  } catch (error) {
    $.handleError(activity, error);
    activity.Response.Data.success = false;
  }
};
