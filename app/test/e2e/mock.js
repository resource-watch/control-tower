const nock = require('nock');

// eslint-disable-next-line arrow-body-style
const createMockEndpoint = (path, params = {}) => {
    const { method = 'post', host = 'http://mymachine:6001' } = params;

    return nock(host)[method](path).reply(200, 'ok');
};

// eslint-disable-next-line arrow-body-style
const createMockEndpointWithHeaders = (path, params = {}) => {
    const { method = 'post', host = 'http://mymachine:6001', headers = {} } = params;

    return nock(host, { reqheaders: headers })[method](path).reply(200, 'ok');
};

// eslint-disable-next-line arrow-body-style
const createMockEndpointWithBody = (path, params) => {
    const { method = 'post', host = 'http://mymachine:6001', body = {} } = params;

    return nock(host)[method](path, body).reply(200, 'ok');
};

module.exports = { createMockEndpoint, createMockEndpointWithBody, createMockEndpointWithHeaders };
