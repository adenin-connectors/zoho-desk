'use strict';

const got = require('got');
const HttpAgent = require('agentkeepalive');
const HttpsAgent = HttpAgent.HttpsAgent;

let _orgId = null;
let _activity = null;

function api(path, opts) {
  if (typeof path !== 'string') {
    return Promise.reject(new TypeError(`Expected \`path\` to be a string, got ${typeof path}`));
  }

  opts = Object.assign({
    json: true,
    token: _activity.Context.connector.token,
    endpoint: 'https://desk.zoho.com/api/v1',
    orgId: _orgId,
    agent: {
      http: new HttpAgent(),
      https: new HttpsAgent()
    }
  }, opts);

  opts.headers = Object.assign({
    accept: 'application/json',
    'user-agent': 'adenin Digital Assistant Connector, https://www.adenin.com/digital-assistant'
  }, opts.headers);

  if (opts.token) opts.headers.Authorization = `Zoho-oauthtoken ${opts.token}`;

  if (_orgId) opts.headers.orgId = _orgId;

  const url = /^http(s)\:\/\/?/.test(path) && opts.endpoint ? path : opts.endpoint + path;

  if (opts.stream) return got.stream(url, opts);

  return got(url, opts).catch((err) => {
    throw err;
  });
}

const helpers = [
  'get',
  'post',
  'put',
  'patch',
  'head',
  'delete'
];

api.initialize = (activity) => {
  _activity = activity;
};

api.stream = (url, opts) => api(url, Object.assign({}, opts, {
  json: false,
  stream: true
}));

for (const x of helpers) {
  const method = x.toUpperCase();
  api[x] = (url, opts) => api(url, Object.assign({}, opts, {method}));
  api.stream[x] = (url, opts) => api.stream(url, Object.assign({}, opts, {method}));
}

//** sends request to the api to get zoho organizations */
api.initOrgId = async function () {
  if (_orgId) return;

  const userOrg = await api('/organizations');

  logger.info(`userOrg response was ${userOrg.statusCode}`);

  if ($.isErrorResponse(_activity, userOrg, [200, 204])) {
    logger.error('userOrg request was error response (not status 200 or 204)');
    return;
  }

  const orgData = userOrg.body.data;

  if (orgData.length !== 1) {
    logger.error('userOrg returned > 1 result');
    throw Error(`Number of organisations must be exactly 1 and we got ${orgData.length}`);
  } else {
    _orgId = orgData[0].id;
  }
};

//** retrieves tickets, if no assigneeId is passed returns all tickets */
api.getTickets = async function (pagination, assigneeId) {
  await api.initOrgId();

  let url = '/tickets?include=contacts,assignee,departments,team,isRead&status=open';

  if (pagination) {
    const pageSize = parseInt(pagination.pageSize);
    const offset = (parseInt(pagination.page) - 1) * pageSize;
    url += `&from=${offset}&limit=${pageSize}`;
  }

  if (assigneeId) url += `&assignee=${assigneeId}`;

  return api(url);
};

api.getCurrentUserId = async function () {
  await api.initOrgId();
  const userProfile = await api('/myinfo?include=profile');
  if ($.isErrorResponse(_activity, userProfile, [200, 204])) return;

  return userProfile.body.id;
};

//**maps response data to items */
api.convertResponse = function (response) {
  const items = [];
  let data = [];

  if (response.body.data) data = response.body.data;

  for (let i = 0; i < data.length; i++) {
    const raw = data[i];

    const item = {
      id: raw.id,
      title: raw.subject,
      description: raw.status,
      date: raw.createdTime,
      link: raw.webUrl,
      raw: raw
    };

    items.push(item);
  }

  return {items};
};

//**filters response based on provided dateRange */
api.filterResponseByDateRange = function (items, dateRange) {
  const filteredItems = [];

  const timeMin = new Date(dateRange.startDate).valueOf();
  const timeMax = new Date(dateRange.endDate).valueOf();

  for (let i = 0; i < items.length; i++) {
    const createTime = new Date(items[i].createdTime).valueOf();

    if (createTime > timeMin && createTime < timeMax) {
      const raw = items[i];

      const item = {
        id: raw.id,
        title: raw.subject,
        description: raw.status,
        date: raw.createdTime,
        link: raw.webUrl,
        raw: raw
      };

      filteredItems.push(item);
    }
  }

  return filteredItems;
};

//** paginate items[] based on provided pagination */
api.paginateItems = function (items, pagination) {
  const paginatedItems = [];
  const pageSize = parseInt(pagination.pageSize);
  const offset = (parseInt(pagination.page) - 1) * pageSize;

  if (offset > items.length) return paginatedItems;

  for (let i = offset; i < offset + pageSize; i++) {
    if (i >= items.length) break;

    paginatedItems.push(items[i]);
  }

  return paginatedItems;
};

module.exports = api;
