'use strict';
const got = require('got');
const isPlainObj = require('is-plain-obj');
const HttpAgent = require('agentkeepalive');
const HttpsAgent = HttpAgent.HttpsAgent;

let _activity = null;
let _orgId = null;

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
    'user-agent': 'adenin Now Assistant Connector, https://www.adenin.com/now-assistant'
  }, opts.headers);

  if (opts.token) {
    opts.headers.Authorization = `Zoho-oauthtoken ${opts.token}`;
  }

  if (typeof _orgId != 'undefined' && _orgId != null) {
    opts.headers.orgId = _orgId;
  }

  const url = /^http(s)\:\/\/?/.test(path) && opts.endpoint ? path : opts.endpoint + path;
  if (opts.stream) {
    return got.stream(url, opts);
  }

  return got(url, opts).catch(err => {
    throw err;
  });
}

function getOrgId(organisations) {
  let orgData = organisations.body.data;

  if (orgData.length != 1) {
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

api.stream = (url, opts) => apigot(url, Object.assign({}, opts, {
  json: false,
  stream: true
}));

api.initialize = function (activity) {
  _activity = activity;
};
for (const x of helpers) {
  const method = x.toUpperCase();
  api[x] = (url, opts) => api(url, Object.assign({}, opts, { method }));
  api.stream[x] = (url, opts) => api.stream(url, Object.assign({}, opts, { method }));
}

api.getTickets = async function (pagination) {
  let userProfile = await api('/organizations');
  _orgId = getOrgId(userProfile);

  let url = '/tickets?include=contacts,assignee,departments,team,isRead';

  if (pagination) {
    let pageSize = parseInt(pagination.pageSize);
    let offset = parseInt(pagination.page) * pageSize;
    url += `&from=${offset}&limit=${pageSize}`;
  }

  return api(url);
};

module.exports = api;
