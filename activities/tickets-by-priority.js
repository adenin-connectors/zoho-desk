'use strict';

const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    await api.initOrgId();

    const limit = 99;

    let offset = 0;
    let url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

    let response = await api(url);

    if ($.isErrorResponse(activity, response, [200, 204])) return;

    const tickets = [];

    tickets.push(...response.body.data);

    let hasMore = false;

    if (response.body.data.length === limit) hasMore = true;

    while (hasMore) {
      offset += limit;
      url = `/tickets?include=contacts,assignee,departments,team,isRead&from=${offset}&limit=${limit}&sortBy=-createdTime`;

      response = await api(url);

      if ($.isErrorResponse(activity, response)) return;

      tickets.push(...response.body.data);

      if (response.body.data.length !== limit) hasMore = false;
    }

    const chartDefinition = createChartDefinition(tickets);

    activity.Response.Data.chart = chartDefinition;
    activity.Response.Data.title = T(activity, 'Tickets by Priority');
    activity.Response.Data.link = `${api.getInstanceDomain()}/ShowHomePage.do#Cases`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};

//** maps response data to data format usable by chart */
function createChartDefinition(tickets) {
  const priorities = [];
  const datasets = [];
  const data = [];

  for (let i = 0; i < tickets.length; i++) {
    const priority = tickets[i].priority ? tickets[i].priority : 'No Priority';

    if (!priorities.includes(priority)) priorities.push(priority);
  }

  for (let x = 0; x < priorities.length; x++) {
    let counter = 0;

    for (let y = 0; y < tickets.length; y++) {
      const status = tickets[y].priority ? tickets[y].priority : 'No Priority';

      if (priorities[x] === status) counter++;
    }

    data.push(counter);
  }

  datasets.push({
    label: 'Number Of Tickets',
    data
  });

  const chart = {
    configuration: {
      data: {
        labels: priorities,
        datasets: datasets
      },
      options: {
        title: {
          display: true,
          text: 'Tickets by Priority'
        }
      }
    },
    template: 'pie-labels'
  };

  return chart;
}
