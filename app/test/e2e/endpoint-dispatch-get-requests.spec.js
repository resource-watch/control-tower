const chai = require('chai');
const nock = require('nock');
const EndpointModel = require('models/endpoint.model');
const {
    getTestAgent,
    closeTestAgent
} = require('./utils/test-server');
const { endpointTest } = require('./utils/test.constants');
const {
    createEndpoint,

    createUserAndToken
} = require('./utils/helpers');

chai.should();
let requester;

describe('Dispatch GET requests', () => {
    before(async () => {
        requester = await getTestAgent();
    });

    it('GET endpoint returns a 200 HTTP code - No user', async () => {

        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: {
                ...endpointTest.redirect,
                method: 'GET'
            }
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            redirect:
                {
                    microservice: 'test1',
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }
            ,
        });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset?foo=bar`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('GET endpoint returns a 200 HTTP code - USER user', async () => {
        const { token } = await createUserAndToken({ role: 'USER' });

        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: {
                ...endpointTest.redirect,
                method: 'GET',
            }
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            method: 'GET',
            redirect:
                {
                    microservice: 'test1',
                    method: 'GET',
                    path: '/api/v1/test1/test',
                    url: 'http://mymachine:6001'
                }

        });

        nock('http://mymachine:6001', { reqheaders: { authorization: `Bearer ${token}` } })
            .get(`/api/v1/dataset?foo=bar`)
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .set('Authorization', `Bearer ${token}`)
            .query({ foo: 'bar' });

        response.status.should.equal(200);
        response.text.should.equal('ok');
    });

    it('GET endpoint returns a 200 HTTP code - Strip loggedUser', async () => {
        // const { token } = await createUserAndToken({ role: 'USER' });

        // eslint-disable-next-line no-useless-escape
        await createEndpoint({
            method: 'GET',
            pathRegex: new RegExp('^/api/v1/dataset$'),
            redirect: {
                ...endpointTest.redirect,
                method: 'GET'
            }
        });
        await createEndpoint({
            path: '/api/v1/test1/test',
            method: 'GET',
            redirect: {
                microservice: 'test1',
                method: 'GET',
                path: '/api/v1/test1/test',
                url: 'http://mymachine:6001'
            }
        });

        nock('http://mymachine:6001')
            .get(`/api/v1/dataset`)
            .query({})
            .reply(200, 'ok');

        const response = await requester
            .get('/api/v1/dataset')
            .query({ loggedUser: '{}' });

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
