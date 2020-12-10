const chai = require('chai');
const nock = require('nock');
const EndpointModel = require('models/endpoint.model');
const querystring = require('querystring');
const {
    getTestAgent,
    closeTestAgent
} = require('./utils/test-server');
const {
    endpointTest,
    testFilter
} = require('./utils/test.constants');
const {
    createEndpoint,
    ensureCorrectError,
    updateVersion,
    createUserAndToken
} = require('./utils/helpers');

chai.should();

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('Dispatch DELETE requests with filters', () => {

    before(async () => {

        requester = await getTestAgent();
    });

    // TODO: This illustrates an issue where the user data is not being handled properly when generating the filter request. Probably should be fixed in the future.
    // it('Endpoint with DELETE filter that expect user data, can be verified and matches return a 200 HTTP code (no filter value) - Null user is passed as query argument', async () => {
    //     await updateVersion();
    //     // eslint-disable-next-line no-useless-escape
    //     await createEndpoint({
    //         pathRegex: new RegExp('^/api/v1/dataset$'),
    //         redirect: [{ ...endpointTest.redirect[0], filters: testFilter({ foo: 'bar' }) }]
    //     });
    //     await createEndpoint({
    //         path: '/api/v1/test1/test',
    //         redirect: [
    //             {
    //                 filters: null,
    //                 method: 'DELETE',
    //                 path: '/api/v1/test1/test',
    //                 url: 'http://mymachine:6001'
    //             }
    //         ],
    //     });
    //
    //     // this is where it's "failing": the generated filter request does not include the user.
    //     createMockEndpointWithBody(`/api/v1/test1/test?loggedUser=${USERS.USER}`, {
    //         response: { body: { data: { foo: 'bar' } } },
    //         method: 'delete'
    //     });
    //     createMockEndpointWithBody('/api/v1/dataset', {
    //         body: {
    //             foo: 'bar',
    //             dataset: { body: { data: { foo: 'bar' } } },
    //         }
    //     });
    //     const response = await requester
    //         .post('/api/v1/dataset')
    //         .set('Authorization', `Bearer ${TOKENS.USER}`)
    //         .send({ foo: 'bar' });
    //
    //     response.status.should.equal(200);
    //     response.text.should.equal('ok');
    // });

    it('Endpoint with DELETE filter that can be verified and matches return a 200 HTTP code (no filter value) - Null user is passed as query argument', async () => {
        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ foo: 'bar' })
            }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'DELETE',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .delete('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .delete(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with DELETE filter that can be verified and matches return a 200 HTTP code (no filter value) - USER null is passed as query argument', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ foo: 'bar' }, { method: 'DELETE' })
            }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            method: 'DELETE',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'DELETE',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .delete('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .delete(`/api/v1/dataset`)
            .query({
                foo: 'bar',
                dataset: JSON.stringify({ body: { data: { foo: 'bar' } } })
            })
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with POST filter that can be verified and matches return a 200 HTTP code (happy case) - Null user is passed as body content', async () => {
        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ foo: 'bar' })
            }]
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
            .delete(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('Endpoint with POST filter that can be verified and matches return a 200 HTTP code (happy case) - USER user is passed as body content', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ foo: 'bar' })
            }]
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
            .delete(`/api/v1/dataset`)
            .query({
                foo: 'bar',
                dataset: JSON.stringify({ body: { data: { foo: 'bar' } } })
            })
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
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
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ foo: 'bar' })
            }]
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
            .delete(`/api/v1/dataset?foo=bar&dataset=${JSON.stringify({ body: { data: { foo: 'bar' } } })}`)
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
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
            method: 'DELETE',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: [{
                ...endpointTest.redirect[0],
                method: 'DELETE',
                filters: testFilter({ test: 'test1' })
            }]
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
            .delete('/api/v1/dataset')
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
            method: 'DELETE',
            redirect: [{
                ...endpointTest.redirect[0],
                filters: testFilter({ test: 'trest1' })
            }]
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
            .delete('/api/v1/dataset')
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
            method: 'DELETE',
            redirect: [
                {
                    ...endpointTest.redirect[0],
                    method: 'DELETE',
                    filters: [
                        testFilter({ foo: 'bar' }),
                        {
                            name: 'widget',
                            path: '/api/v1/test2/test',
                            pathRegex: new RegExp('/api/v1/test2/test'),
                            method: 'DELETE',
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
            method: 'DELETE',
            path: '/api/v1/test2/test',
            redirect: [
                {
                    microservice: 'test1',
                    filters: null,
                    method: 'DELETE',
                    path: '/api/v1/test2/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/test1/test')
            .reply(200, { body: { data: { foo: 'bar' } } });

        nock('http://mymachine:6001')
            .delete('/api/v1/test2/test')
            .reply(200, { body: { data: { boo: 'tar' } } });

        const queryString = querystring.stringify({
            dataset: JSON.stringify({ body: { data: { foo: 'bar' } } }),
            widget: JSON.stringify({ body: { data: { boo: 'tar' } } }),
            foo: 'bar'
        });

        nock('http://mymachine:6001')
            .delete(`/api/v1/dataset?${queryString}`)
            .reply(200, 'ok');

        const response = await requester
            .delete('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    afterEach(async () => {
        await EndpointModel.deleteMany({})
            .exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(closeTestAgent);
});
