'use strict';

const api = require('./common/api');

module.exports = async (activity) => {
  try {
    //'/ticketsCount' returns error 500 bit in my opinion is fastest request
    process.env.NODE_ENV = 'development';

    logger.info('Initializing activity');

    api.initialize(activity);

    logger.info('Initializing org ID');

    await api.initOrgId();

    const response = await api('/organizations');

    logger.info(`/organizations ping response was ${response.statusCode}`);

    if ($.isErrorResponse(activity, response)) {
      logger.error('/organisations ping response was error');
      return;
    }

    activity.Response.Data = {
      success: response && response.statusCode === 200
    };
  } catch (error) {
    logger.error(error);
    $.handleError(activity, error);
    activity.Response.Data.success = false;
  }
};
