const nock = require('nock');

const MicroserviceModel = require('models/microservice.model');
const EndpointModel = require('models/endpoint.model');

const { getTestAgent, closeTestAgent } = require('./utils/test-server');
const {
    createUserAndToken, createEndpoint, setPluginSetting, mockGetUserFromToken
} = require('./utils/helpers');
const { createMockEndpoint } = require('./utils/mock');

let requester;

const createCRUDEndpoints = async () => Promise.all([
    createEndpoint({
        path: '/v1/dataset',
        method: 'GET',
        redirect: [
            {
                microservice: 'dataset',
                filters: null,
                method: 'GET',
                path: '/api/v1/dataset',
                url: 'http://mymachine:6001'
            }
        ],
    }),
    createEndpoint({
        path: '/v1/dataset',
        method: 'POST',
        redirect: [
            {
                microservice: 'dataset',
                filters: null,
                method: 'POST',
                path: '/api/v1/dataset',
                url: 'http://mymachine:6001'
            }
        ],
    }),
    createEndpoint({
        path: '/v1/dataset',
        method: 'PUT',
        redirect: [
            {
                microservice: 'dataset',
                filters: null,
                method: 'PUT',
                path: '/api/v1/dataset',
                url: 'http://mymachine:6001'
            }
        ],
    }),
    createEndpoint({
        path: '/v1/dataset',
        method: 'PATCH',
        redirect: [
            {
                microservice: 'dataset',
                filters: null,
                method: 'PATCH',
                path: '/api/v1/dataset',
                url: 'http://mymachine:6001'
            }
        ],
    }),
    createEndpoint({
        path: '/v1/dataset',
        method: 'DELETE',
        redirect: [
            {
                microservice: 'dataset',
                filters: null,
                method: 'DELETE',
                path: '/api/v1/dataset',
                url: 'http://mymachine:6001'
            }
        ],
    })
]);

describe('Read-only mode spec', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        await MicroserviceModel.deleteMany({}).exec();
        await EndpointModel.deleteMany({}).exec();
    });

    beforeEach(async () => {
        // await setPluginSetting('oauth', 'ordering', 1);
        await setPluginSetting('readOnly', 'ordering', 0);
        await setPluginSetting('readOnly', 'active', true);
        await setPluginSetting('readOnly', 'config.blacklist', []);
        await setPluginSetting('readOnly', 'config.whitelist', []);

        // requester = await getTestAgent(true);
    });

    it('When read-only mode is ON, GET requests that are NOT blacklisted should be passed through', async () => {
        await createCRUDEndpoints();
        requester = await getTestAgent(true);

        createMockEndpoint('/api/v1/dataset', { method: 'get' });
        const getResult = await requester.get('/api/v1/dataset');
        getResult.status.should.equal(200);
        getResult.text.should.equal('ok');
    });

    it('When read-only mode is ON, POST/PUT/PATCH/DELETE requests that are NOT whitelisted should return appropriate error message', async () => {
        await createCRUDEndpoints();
        requester = await getTestAgent(true);

        const postResult = await requester.post('/api/v1/dataset');
        postResult.status.should.equal(503);
        postResult.text.should.equal('API under maintenance, please try again later.');

        const putResult = await requester.put('/api/v1/dataset');
        putResult.status.should.equal(503);
        putResult.text.should.equal('API under maintenance, please try again later.');

        const patchResult = await requester.patch('/api/v1/dataset');
        patchResult.status.should.equal(503);
        patchResult.text.should.equal('API under maintenance, please try again later.');

        const deleteResult = await requester.delete('/api/v1/dataset');
        deleteResult.status.should.equal(503);
        deleteResult.text.should.equal('API under maintenance, please try again later.');
    });

    it('When read-only mode is ON, GET requests that ARE blacklisted should return appropriate error message', async () => {
        await createCRUDEndpoints();
        await setPluginSetting('readOnly', 'config.blacklist', ['/api/v1/dataset']);
        requester = await getTestAgent(true);

        const getResult = await requester.get('/api/v1/dataset');
        getResult.status.should.equal(503);
        getResult.text.should.equal('API under maintenance, please try again later.');
    });

    it('When read-only mode is ON, POST/PUT/PATCH/DELETE requests that ARE whitelisted should be passed through', async () => {
        await createCRUDEndpoints();
        await setPluginSetting('readOnly', 'config.whitelist', ['/api/v1/dataset']);
        requester = await getTestAgent(true);

        createMockEndpoint('/api/v1/dataset', { method: 'post' });
        const postResult = await requester.post('/api/v1/dataset');
        postResult.status.should.equal(200);
        postResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'put' });
        const putResult = await requester.put('/api/v1/dataset');
        putResult.status.should.equal(200);
        putResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'patch' });
        const patchResult = await requester.patch('/api/v1/dataset');
        patchResult.status.should.equal(200);
        patchResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'delete' });
        const deleteResult = await requester.delete('/api/v1/dataset');
        deleteResult.status.should.equal(200);
        deleteResult.text.should.equal('ok');
    });

    it('Applies the same read-only criteria for CT endpoints', async () => {
        requester = await getTestAgent(true);

        const { token, user } = await createUserAndToken({ role: 'ADMIN' });

        mockGetUserFromToken(user, token);

        const getResult = await requester
            .get('/api/v1/microservice')
            .set('Authorization', `Bearer ${token}`);
        getResult.status.should.equal(200);
        getResult.text.should.equal('[]');

        const postResult = await requester.post('/api/v1/microservice');
        postResult.status.should.equal(503);
        postResult.text.should.equal('API under maintenance, please try again later.');

        const putResult = await requester.put('/api/v1/microservice');
        putResult.status.should.equal(503);
        putResult.text.should.equal('API under maintenance, please try again later.');

        const patchResult = await requester.patch('/api/v1/microservice');
        patchResult.status.should.equal(503);
        patchResult.text.should.equal('API under maintenance, please try again later.');

        const deleteResult = await requester.delete('/api/v1/microservice');
        deleteResult.status.should.equal(503);
        deleteResult.text.should.equal('API under maintenance, please try again later.');
    });

    it('Allows usage of Regex to define paths on blacklist', async () => {
        await createCRUDEndpoints();
        await setPluginSetting('readOnly', 'config.blacklist', ['.*dataset.*']);
        requester = await getTestAgent(true);

        const getResult = await requester.get('/api/v1/dataset');
        getResult.status.should.equal(503);
        getResult.text.should.equal('API under maintenance, please try again later.');
    });

    it('Allows usage of Regex to define paths on whitelist', async () => {
        await createCRUDEndpoints();
        await setPluginSetting('readOnly', 'config.whitelist', ['.*dataset.*']);
        requester = await getTestAgent(true);

        createMockEndpoint('/api/v1/dataset', { method: 'post' });
        const postResult = await requester.post('/api/v1/dataset');
        postResult.status.should.equal(200);
        postResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'put' });
        const putResult = await requester.put('/api/v1/dataset');
        putResult.status.should.equal(200);
        putResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'patch' });
        const patchResult = await requester.patch('/api/v1/dataset');
        patchResult.status.should.equal(200);
        patchResult.text.should.equal('ok');

        createMockEndpoint('/api/v1/dataset', { method: 'delete' });
        const deleteResult = await requester.delete('/api/v1/dataset');
        deleteResult.status.should.equal(200);
        deleteResult.text.should.equal('ok');
    });

    afterEach(async () => {
        await MicroserviceModel.deleteMany({}).exec();
        await EndpointModel.deleteMany({}).exec();

        await setPluginSetting('readOnly', 'active', false);

        closeTestAgent();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
