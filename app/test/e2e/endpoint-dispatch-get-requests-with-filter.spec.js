const chai = require('chai');
const nock = require('nock');
const EndpointModel = require('models/endpoint.model');
const { getTestAgent, closeTestAgent } = require('./utils/test-server');
const { endpointTest, testFilter } = require('./utils/test.constants');
const {
    createEndpoint, ensureCorrectError, updateVersion, createUserAndToken
} = require('./utils/helpers');

chai.should();
let requester;

describe('Dispatch GET requests with filters', () => {
    before(async () => {
        requester = await getTestAgent();
    });

    it('Endpoint with GET filter that can be verified and matches return a 200 HTTP code (no filter value) - Null user is passed as query argument', async () => {
        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{ ...endpointTest.redirect[0], method: 'GET', filters: testFilter({ foo: 'bar' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
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
            .get('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with GET filter that can be verified and matches return a 200 HTTP code (no filter value) - USER user is passed as query argument', async () => {
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
            .get('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with POST filter that can be verified and matches return a 200 HTTP code (happy case) - Null user is passed as body content', async () => {
        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{ ...endpointTest.redirect[0], method: 'GET', filters: testFilter({ foo: 'bar' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with POST filter that can be verified and matches return a 200 HTTP code (happy case) - USER user is passed as body content', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{ ...endpointTest.redirect[0], method: 'GET', filters: testFilter({ foo: 'bar' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        // TODO: token should probably be passed to the filter request too
        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with filters that can be verified and match return a 200 HTTP code (happy case)', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{ ...endpointTest.redirect[0], method: 'GET', filters: testFilter({ foo: 'bar' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with filters that can be verified and don\'t match return a 404 HTTP code with a "Endpoint not found" message', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{ ...endpointTest.redirect[0], method: 'GET', filters: testFilter({ test: 'test1' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { data: { test: 'bar' } });

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        ensureCorrectError(response, 'Endpoint not found', 404);
    });

    it('Endpoint with filters that return a 404 response should return a 404 HTTP code with a "Endpoint not found" message', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            pathRegex: new RegExp('^/api/v1/dataset$'),
            method: 'GET',
            redirect: [{ ...endpointTest.redirect[0], filters: testFilter({ test: 'trest1' }) }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        // TODO: token should probably be passed to the filter request too
        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(404);

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        ensureCorrectError(response, 'Endpoint not found', 404);
    });

    it('Endpoint with multiple filters with multiple types that can be verified and match return a 200 HTTP code (happy case)', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            pathRegex: new RegExp('^/api/v1/dataset$'),
            method: 'GET',
            redirect: [
                {
                    ...endpointTest.redirect[0],
                    method: 'GET',
                    filters: [
                        testFilter({ foo: 'bar' }),
                        {
                            name: 'widget',
                            path: '/api/v1/test2/test',
                            pathRegex: new RegExp('/api/v1/test2/test'),
                            method: 'GET',
                            compare: { data: { boo: 'tar' } }
                        }
                    ]
                }
            ]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'POST',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });
        await createEndpoint({
            method: 'GET',
            path: '/api/v1/test2/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'GET',
                    path: '/api/v1/test2/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });
        nock('http://mymachine:6001')
            .get('/api/v1/test2/test')
            .reply(200, { body: { data: { boo: 'tar' } } });

        const query = {
            dataset: JSON.stringify({ body: { data: { foo: 'bar' } } }),
            widget: JSON.stringify({ body: { data: { boo: 'tar' } } }),
            foo: 'bar'
        };

        nock('http://mymachine:6001')
            .get('/api/v1/dataset')
            .query(query)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
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
