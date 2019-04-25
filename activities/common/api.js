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

function getOrgId(organisations) {
  const orgData = organisations.body.data;

  if (orgData.length !== 1) {
    throw Error(`Number of organisations must be exactly 1 and we got ${orgData.length}`);
  } else {
    return orgData[0].id;
  }
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

api.stream = (url, opts) => got(url, Object.assign({}, opts, {
  json: false,
  stream: true
}));

for (const x of helpers) {
  const method = x.toUpperCase();
  api[x] = (url, opts) => api(url, Object.assign({}, opts, { method }));
  api.stream[x] = (url, opts) => api.stream(url, Object.assign({}, opts, { method }));
}

api.initOrgId = async function () {
  const userProfile = await api('/organizations');
  if ($.isErrorResponse(_activity, userProfile, [200, 204])) return;
  _orgId = getOrgId(userProfile);
};

api.getTickets = async function (pagination) {
  await api.initOrgId();

  let url = '/tickets?include=contacts,assignee,departments,team,isRead&status=open';

  if (pagination) {
    const pageSize = parseInt(pagination.pageSize, 10);
    const offset = parseInt(pagination.page) * pageSize;
    url += `&from=${offset}&limit=${pageSize}`;
  }

  return api(url);
};

//**maps response data to items */
api.convertResponse = function (response) {
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
module.exports = api;
