const nock = require('nock');
const { ObjectId } = require('mongoose').Types;
const DispatcherService = require('services/dispatcher.service');
const MicroserviceModel = require('models/microservice.model');
const EndpointModel = require('models/endpoint.model');
const { endpointTest } = require('./test.constants');

const getUUID = () => Math.random()
    .toString(36)
    .substring(7);

const hexToString = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
};

const createUser = (userData) => ({
    _id: new ObjectId(),
    name: `${getUUID()} name`,
    email: `${getUUID()}@control-tower.com`,
    password: '$password.hash',
    salt: '$password.salt',
    extraUserData: {
        apps: ['rw']
    },
    role: 'USER',
    provider: 'local',
    userToken: 'myUserToken',
    photo: `http://photo.com/${getUUID()}.jpg`,
    ...userData
});

const createUserAndToken = async (userData) => {
    const user = createUser(userData);

    const token = `${getUUID()}`;

    return {
        user,
        token
    };
};

const createMicroservice = async (microserviceData) => (MicroserviceModel({
    name: 'test microservice name',
    url: 'http://microservice.com',
    endpoints: [],
    ...microserviceData
})
    .save());

const createEndpoint = async (endpoint) => {
    const endpointModel = await new EndpointModel({ ...endpointTest, ...endpoint }).save();
    await DispatcherService.reloadEndpoints();
    return endpointModel;
};

const createMicroserviceWithEndpoints = async (microserviceData) => {
    const microservice = await createMicroservice(microserviceData);

    const endpoints = [];

    microserviceData.endpoints.forEach((endpointData) => {

        endpointData.redirect = [endpointData.redirect];

        if (!endpointData.redirect.url) {
            endpointData.redirect.url = microservice.url;
            endpointData.redirect.microservice = microservice.name;
        }

        if (!endpointData.redirect.url) {
            endpointData.redirect.url = microservice.url;
        }
        endpoints.push(createEndpoint(endpointData));
    });

    await Promise.all(endpoints);

    return {
        microservice,
        endpoints
    };
};

const mockGetUserFromToken = (userProfile, token) => {
    nock(process.env.AUTHORIZATION_URL, { reqheaders: { authorization: `Bearer ${token}` } })
        .get('/auth/user/me')
        .reply(200, userProfile);
};

const isAdminOnly = async (requester, method, url) => {
    const {
        token: managerToken,
        user: managerUser
    } = await createUserAndToken({ role: 'MANAGER' });
    const {
        token: userToken,
        user: userUser
    } = await createUserAndToken({ role: 'USER' });

    mockGetUserFromToken(managerUser, managerToken);
    mockGetUserFromToken(userUser, userToken);

    const request = (token) => requester[method](`/api/v1/${url}`)
        .set('Authorization', `Bearer ${token}`);

    const validate = (res) => {
        res.status.should.equal(403);
        res.body.errors[0].should.have.property('detail')
            .and
            .equal('Not authorized');
    };

    const responses = await Promise.all([request(userToken), request(managerToken)]);
    responses.map(validate);
};

const isTokenRequired = async (requester, method, url) => {
    const response = await requester[method](`/api/v1/${url}`);

    response.body.errors[0].should.have.property('detail')
        .and
        .equal('Not authenticated');
    response.status.should.equal(401);
};

const ensureCorrectError = ({ body }, errMessage, expectedStatus) => {
    body.should.have.property('errors')
        .and
        .be
        .an('array');
    body.errors[0].should.have.property('detail')
        .and
        .equal(errMessage);
    body.errors[0].should.have.property('status')
        .and
        .equal(expectedStatus);
};

const ensureHasPaginationElements = (response) => {
    response.body.should.have.property('meta')
        .and
        .be
        .an('object');
    response.body.meta.should.have.property('total-pages')
        .and
        .be
        .a('number');
    response.body.meta.should.have.property('total-items')
        .and
        .be
        .a('number');
    response.body.meta.should.have.property('size')
        .and
        .equal(10);

    response.body.should.have.property('links')
        .and
        .be
        .an('object');
    response.body.links.should.have.property('self')
        .and
        .be
        .a('string');
    response.body.links.should.have.property('first')
        .and
        .be
        .a('string');
    response.body.links.should.have.property('last')
        .and
        .be
        .a('string');
    response.body.links.should.have.property('prev')
        .and
        .be
        .a('string');
    response.body.links.should.have.property('next')
        .and
        .be
        .a('string');
};

module.exports = {
    hexToString,
    createUser,
    getUUID,
    ensureCorrectError,
    createEndpoint,
    createUserAndToken,
    createMicroservice,
    createMicroserviceWithEndpoints,
    isTokenRequired,
    isAdminOnly,
    ensureHasPaginationElements,
    mockGetUserFromToken
};
