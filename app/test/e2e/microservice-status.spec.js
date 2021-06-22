const logger = require('logger');
const nock = require('nock');
const MicroserviceModel = require('models/microservice.model');
const EndpointModel = require('models/endpoint.model');
const { microserviceTest } = require('./utils/test.constants');
const { createUserAndToken } = require('./utils/helpers');
const { getTestAgent, closeTestAgent } = require('./utils/test-server');

let requester;

const createMicroservice = () => {
    const testMicroserviceOne = {
        name: `test-microservice-one`,
        url: 'http://test-microservice-one:8000',
        active: true
    };

    nock('http://test-microservice-one:8000')
        .get((uri) => {
            logger.info('Uri', uri);
            return uri.startsWith('/info');
        })
        .reply(200, microserviceTest);

    return requester.post('/api/v1/microservice').send(testMicroserviceOne);
};

describe('Microservice status calls', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestAgent();
    });

    it('Getting a list of statuses with created microservice should return empty array', async () => {
        const { token } = await createUserAndToken({ role: 'ADMIN' });

        const list = await requester
            .get('/api/v1/microservice/status')
            .set('Authorization', `Bearer ${token}`);
        list.status.should.equal(200);
        list.body.should.be.an('array').and.lengthOf(0);
    });

    it('Getting a list of statuses with created microservice should return the result', async () => {
        const { token } = await createUserAndToken({ role: 'ADMIN' });

        await createMicroservice();

        const list = await requester
            .get('/api/v1/microservice/status')
            .set('Authorization', `Bearer ${token}`);

        list.status.should.equal(200);
        list.body.should.be.an('array').and.length.above(0);

        list.body[0].should.deep.equal({
            status: 'active',
            name: 'test-microservice-one'
        });
    });

    afterEach(async () => {
        await MicroserviceModel.deleteMany({}).exec();
        await EndpointModel.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(closeTestAgent);
});
