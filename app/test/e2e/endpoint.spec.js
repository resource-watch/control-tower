const nock = require('nock');
const Microservice = require('models/microservice.model');
const Endpoint = require('models/endpoint.model');
const { endpointTest } = require('./utils/test.constants');
const {
    isTokenRequired,
    createUserAndToken,
    mockGetUserFromToken
} = require('./utils/helpers');
const {
    getTestAgent,
    closeTestAgent
} = require('./utils/test-server');

let requester;

describe('GET Endpoints', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestAgent();
    });

    beforeEach(async () => {
        await Endpoint.deleteMany({})
            .exec();
        await Microservice.deleteMany({})
            .exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    it('Getting a list of endpoints without being authenticated should fail with a 401 error', () => {
        isTokenRequired(requester, 'get', 'plugin');
    });

    it('Getting a list of endpoints without creating microservice should return empty array', async () => {
        const {
            token,
            user
        } = await createUserAndToken({ role: 'ADMIN' });

        mockGetUserFromToken(user, token);

        const response = await requester
            .get('/api/v1/endpoint')
            .set('Authorization', `Bearer ${token}`);

        response.status.should.equal(200);
        response.body.should.be.an('array')
            .and
            .lengthOf(0);
    });

    it('Getting a list of endpoints should return those endpoints (happy case)', async () => {
        const {
            token,
            user
        } = await createUserAndToken({ role: 'ADMIN' });

        mockGetUserFromToken(user, token);

        await new Endpoint({ ...endpointTest }).save();

        const resEndpoints = await requester
            .get('/api/v1/endpoint')
            .set('Authorization', `Bearer ${token}`);

        resEndpoints.status.should.equal(200);
        resEndpoints.body.should.be.an('array')
            .and
            .length
            .above(0);

        delete resEndpoints.body[0]._id;
        delete resEndpoints.body[0].redirect[0]._id;

        resEndpoints.body[0].should.have.property('createdAt')
            .and
            .be
            .a('string');
        resEndpoints.body[0].should.have.property('updatedAt')
            .and
            .be
            .a('string');

        delete resEndpoints.body[0].createdAt;
        delete resEndpoints.body[0].updatedAt;

        resEndpoints.body[0].should.deep.equal(
            {
                pathKeys: [],
                binary: false,
                path: '/v1/dataset',
                method: 'POST',
                pathRegex: {},
                redirect: [
                    {
                        microservice: 'dataset',
                        method: 'POST',
                        path: '/api/v1/dataset',
                        url: 'http://mymachine:6001'
                    }
                ],
            }
        );
    });

    afterEach(() => {
        Microservice.deleteMany({})
            .exec();
        Endpoint.deleteMany({})
            .exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(closeTestAgent);
});
