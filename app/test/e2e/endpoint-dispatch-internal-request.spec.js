const chai = require('chai');
const nock = require('nock');
const EndpointModel = require('models/endpoint.model');
const { getTestAgent, closeTestAgent } = require('./utils/test-server');
const { endpointTest, testFilter } = require('./utils/test.constants');
const {
    createEndpoint, updateVersion, createUserAndToken
} = require('./utils/helpers');

chai.should();
let requester;

describe('Dispatch internal requests', () => {
    before(async () => {
        requester = await getTestAgent();
    });

    it('Pass authentication on the \'authentication\' header without the Bearer prefix should work as an authentication mechanism', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'GET',
                filters: testFilter({ foo: 'bar' }, { method: 'GET' })
            }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            method: 'GET',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .get(`/api/v1/test1/test`)
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('authentication', `${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    afterEach(async () => {
        await EndpointModel.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(closeTestAgent);
});
