const chai = require('chai');
const nock = require('nock');
const Endpoint = require('models/endpoint.model');
const fs = require('fs');
const { getTestAgent } = require('./utils/test-server');
const { endpointTest } = require('./utils/test.constants');
const {
    createEndpoint,
    hexToString,
    createUserAndToken
} = require('./utils/helpers');
const {
    createMockEndpoint,
    createMockEndpointWithBody,
    createMockEndpointWithHeaders
} = require('./utils/mock');

chai.should();
let microservice;

const changeMethod = (method) => ({
    ...endpointTest,
    method,
    redirect: {
        ...endpointTest.redirect,
        method
    }
});

describe('Endpoint dispatch tests', () => {
    before(async () => {
        microservice = await getTestAgent();
    });

    it('Created endpoint should return a 200 HTTP code', async () => {

        await createEndpoint();
        createMockEndpoint('/api/v1/dataset');
        const result = await microservice.post('/api/v1/dataset');
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s query params are passed along to the internal call on POST requests', async () => {

        await createEndpoint(changeMethod('POST'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .post('/api/v1/dataset')
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const result = await microservice
            .post('/api/v1/dataset')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            });

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params, files and post fields are passed along to the internal call on POST requests with multipart content type', async () => {

        await createEndpoint(changeMethod('POST'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .post('/api/v1/dataset', (body) => {
                const decodedBody = hexToString(body);

                decodedBody.should.include('name="foo"\r\n\r\nbar');
                return true;
            })
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const fileData = fs.readFileSync(`${__dirname}/assets/sample.png`);

        const result = await microservice
            .post('/api/v1/dataset')
            .set('Content-Type', 'multipart/form-data')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            })
            .field('foo', 'bar')
            .attach('image', fileData, 'sample.png');

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params are passed along to the internal call on PUT requests', async () => {

        await createEndpoint(changeMethod('PUT'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .put('/api/v1/dataset')
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const result = await microservice
            .put('/api/v1/dataset')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            });

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params, files and post fields are passed along to the internal call on PUT requests with multipart content type', async () => {

        await createEndpoint(changeMethod('PUT'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .put('/api/v1/dataset', (body) => {
                const decodedBody = hexToString(body);

                decodedBody.should.include('name="foo"\r\n\r\nbar');
                return true;
            })
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const fileData = fs.readFileSync(`${__dirname}/assets/sample.png`);

        const result = await microservice
            .put('/api/v1/dataset')
            .set('Content-Type', 'multipart/form-data')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            })
            .field('foo', 'bar')
            .attach('image', fileData, 'sample.png');

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params are passed along to the internal call on GET requests', async () => {

        await createEndpoint(changeMethod('GET'));
        createMockEndpoint('/api/v1/dataset?test1=test&test2=test', { method: 'get' });
        const result = await microservice.get('/api/v1/dataset')
            .query({
                test1: 'test',
                test2: 'test'
            });
        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params are passed along to the internal call on PATCH requests', async () => {

        await createEndpoint(changeMethod('PATCH'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .patch('/api/v1/dataset')
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const result = await microservice
            .patch('/api/v1/dataset')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            });

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params, files and post fields are passed along to the internal call on PATCH requests with multipart content type', async () => {

        await createEndpoint(changeMethod('PATCH'));

        const { token } = await createUserAndToken();

        nock('http://mymachine:6001')
            .patch('/api/v1/dataset', (body) => {
                const decodedBody = hexToString(body);

                decodedBody.should.include('name="foo"\r\n\r\nbar');
                return true;
            })
            .query({
                test1: 'test',
                test2: 'test'
            })
            .reply(200, 'ok');

        const fileData = fs.readFileSync(`${__dirname}/assets/sample.png`);

        const result = await microservice
            .patch('/api/v1/dataset')
            .set('Content-Type', 'multipart/form-data')
            .set('Authorization', `Bearer ${token}`)
            .query({
                test1: 'test',
                test2: 'test'
            })
            .field('foo', 'bar')
            .attach('image', fileData, 'sample.png');

        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s query params are passed along to the internal call on DELETE requests', async () => {

        await createEndpoint(changeMethod('DELETE'));
        createMockEndpoint('/api/v1/dataset?test1=test&test2=test', { method: 'delete' });
        const result = await microservice.delete('/api/v1/dataset')
            .query({
                test1: 'test',
                test2: 'test'
            });
        result.text.should.equal('ok');
        result.status.should.equal(200);
    });

    it('External request\'s body content should be absent the internal call on GET requests', async () => {

        await createEndpoint(changeMethod('GET'));
        createMockEndpoint('/api/v1/dataset', { method: 'get' });
        const result = await microservice.get('/api/v1/dataset')
            .send({
                test1: 'test',
                test2: 'test'
            });
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s body content should be absent the internal call on DELETE requests', async () => {

        await createEndpoint(changeMethod('DELETE'));
        createMockEndpoint('/api/v1/dataset', { method: 'delete' });
        const result = await microservice.delete('/api/v1/dataset')
            .send({ test1: 'test2' });
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s body content should be present the internal call on POST requests', async () => {

        await createEndpoint();
        createMockEndpointWithBody('/api/v1/dataset', { body: { test1: 'test2' } });
        const result = await microservice.post('/api/v1/dataset')
            .send({ test1: 'test2' });
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s body content should be present the internal call on PATCH requests', async () => {

        await createEndpoint(changeMethod('PATCH'));
        createMockEndpointWithBody('/api/v1/dataset', {
            method: 'patch',
            body: { test1: 'test2' }
        });
        const result = await microservice.patch('/api/v1/dataset')
            .send({ test1: 'test2' });
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s body content should be present the internal call on PUT requests', async () => {

        await createEndpoint(changeMethod('PUT'));
        createMockEndpointWithBody('/api/v1/dataset', {
            method: 'put',
            body: { test1: 'test2' }
        });
        const result = await microservice.put('/api/v1/dataset')
            .send({ test1: 'test2' });
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('Forwarding an external POST request to an internal GET request should work as intended (happy case)', async () => {

        await createEndpoint({
            ...endpointTest,
            redirect: {
                ...endpointTest.redirect,
                method: 'get'
            }
        });
        createMockEndpoint('/api/v1/dataset', { method: 'get' });
        const result = await microservice.post('/api/v1/dataset');
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External request\'s headers should be present the internal request', async () => {

        await createEndpoint();
        createMockEndpointWithHeaders('/api/v1/dataset', { headers: { location: 'test2' } });
        const result = await microservice.post('/api/v1/dataset')
            .set('location', 'test2');
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('External stream requests are supported', async () => {

        await createEndpoint({ binary: true });
        createMockEndpoint('/api/v1/dataset');
        const result = await microservice.post('/api/v1/dataset');
        result.status.should.equal(200);
    });

    it('Endpoint with pathRegex are matched to external requests and return a 200 HTTP code (positive test)', async () => {

        // eslint-disable-next-line no-useless-escape
        await createEndpoint({ pathRegex: new RegExp('^/api/v1/dataset/[0-9]*$') });
        createMockEndpoint('/api/v1/dataset');
        const result = await microservice.post('/api/v1/dataset/123');
        result.status.should.equal(200);
        result.text.should.equal('ok');
    });

    it('Endpoint with pathRegex are not matched to external requests and return a 404 HTTP code (negative test)', async () => {

        // eslint-disable-next-line no-useless-escape
        await createEndpoint({ pathRegex: new RegExp('^/api/v1/dataset/[0-9]*$') });
        const result = await microservice.post('/api/v1/dataset/sadasd');
        result.status.should.equal(404);
    });

    afterEach(async () => {
        await Endpoint.deleteMany({})
            .exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
