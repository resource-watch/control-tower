const chai = require('chai');
const nock = require('nock');
const EndpointModel = require('models/endpoint.model');
const { getTestAgent, closeTestAgent } = require('./utils/test-server');
const {
    endpointTest
} = require('./utils/test.constants');
const {
    createEndpoint, updateVersion, createUserAndToken
} = require('./utils/helpers');

chai.should();
let requester;

describe('Dispatch PATCH requests', () => {
    before(async () => {
        requester = await getTestAgent();
    });

    it('PATCH endpoint returns a 200 HTTP code - No user', async () => {
        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            pathRegex: new RegExp('^/api/v1/dataset$'),
            method: 'PATCH',
            redirect: [{ ...endpointTest.redirect[0] }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001')
            .post('/api/v1/dataset', {
                foo: 'bar',
            })
            .reply(200, 'ok');

        const response = await requester
            .patch('/api/v1/dataset')
            .send({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PATCH endpoint returns a 200 HTTP code - USER user', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            pathRegex: new RegExp('^/api/v1/dataset$'),
            method: 'PATCH',
            redirect: [{ ...endpointTest.redirect[0] }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001', { reqheaders: { authorization: `Bearer ${token}` } })
            .post('/api/v1/dataset', {
                foo: 'bar',
            })
            .reply(200, 'ok');

        const response = await requester
            .patch('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .send({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('PATCH endpoint returns a 200 HTTP code - Strip loggedUser', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        await updateVersion();
        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            pathRegex: new RegExp('^/api/v1/dataset$'),
            method: 'PATCH',
            redirect: [{ ...endpointTest.redirect[0] }]
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect: [
                {
                    microservice: 'test1',
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ],
        });

        nock('http://mymachine:6001', { reqheaders: { authorization: `Bearer ${token}` } })
            .post('/api/v1/dataset', {
                foo: 'bar',
            })
            .reply(200, 'ok');

        const response = await requester
            .patch('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .send({ foo: 'bar', loggedUser: {} });

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
