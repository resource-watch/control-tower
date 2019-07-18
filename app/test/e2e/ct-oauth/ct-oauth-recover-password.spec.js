const nock = require('nock');
const chai = require('chai');

const UserModel = require('plugins/sd-ct-oauth-plugin/models/user.model');
const UserTempModel = require('plugins/sd-ct-oauth-plugin/models/user-temp.model');
const RenewModel = require('plugins/sd-ct-oauth-plugin/models/renew.model');
const { isEqual } = require('lodash');

const should = chai.should();

const { getTestAgent, closeTestAgent } = require('./../test-server');

let requester;


nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('OAuth endpoints tests - Recover password', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestAgent(true);

        UserModel.deleteMany({}).exec();
        UserTempModel.deleteMany({}).exec();

        nock.cleanAll();
    });

    beforeEach(async () => {

        UserModel.deleteMany({}).exec();
        UserTempModel.deleteMany({}).exec();
        RenewModel.deleteMany({}).exec();

        nock.cleanAll();
    });

    it('Recover password request with no email should return an error - HTML format (TODO: this should return a 422)', async () => {
        const response = await requester
            .post(`/auth/reset-password`)
            .send();


        response.status.should.equal(200);
        response.header['content-type'].should.equal('text/html; charset=utf-8');
        response.text.should.include(`Mail required`);
    });

    it('Recover password request with no email should return an error - JSON format', async () => {
        const response = await requester
            .post(`/auth/reset-password`)
            .set('Content-Type', 'application/json')
            .send();


        response.status.should.equal(422);
        response.header['content-type'].should.equal('application/json; charset=utf-8');
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Mail required`);
    });

    it('Recover password request with non-existing email should return an error - HTML format', async () => {
        const response = await requester
            .post(`/auth/reset-password`)
            .type('form')
            .send({
                email: 'pepito@gmail.com'
            });

        response.status.should.equal(200);
        response.header['content-type'].should.equal('text/html; charset=utf-8');
        response.text.should.include(`User not found`);
    });

    it('Recover password request with non-existing email should return a 422 error - JSON format', async () => {
        const response = await requester
            .post(`/auth/reset-password`)
            .set('Content-Type', 'application/json')
            .send({
                email: 'pepito@gmail.com'
            });

        response.status.should.equal(422);
        response.header['content-type'].should.equal('application/json; charset=utf-8');
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`User not found`);
    });

    it('Recover password request with correct email should return OK - HTML format', async () => {
        nock('https://api.sparkpost.com')
            .post('/api/v1/transmissions', (body) => {
                const expectedRequestBody = {
                    content: {
                        template_id: 'recover-password'
                    },
                    recipients: [
                        {
                            address: {
                                email: 'potato@gmail.com'
                            }
                        }
                    ],
                    substitution_data: {
                        fromName: 'RW API',
                        appName: 'RW API',
                        logo: 'https://resourcewatch.org/static/images/logo-embed.png'
                    }
                };

                body.should.have.property('substitution_data').and.be.an('object');
                body.substitution_data.should.have.property('urlRecover').and.include(`${process.env.PUBLIC_URL}/auth/reset-password/`);

                delete body.substitution_data.urlRecover;

                body.should.deep.equal(expectedRequestBody);

                return isEqual(body, expectedRequestBody);
            })
            .once()
            .reply(200, {
                results: {
                    total_rejected_recipients: 0,
                    total_accepted_recipients: 1,
                    id: 11668787484950529
                }
            });

        await new UserModel({
            email: 'potato@gmail.com'
        }).save();

        const response = await requester
            .post(`/auth/reset-password`)
            .type('form')
            .send({
                email: 'potato@gmail.com'
            });

        response.status.should.equal(200);
        response.header['content-type'].should.equal('text/html; charset=utf-8');
        response.text.should.include(`Email sent`);
    });

    it('Recover password request with correct email should return OK - JSON format', async () => {
        nock('https://api.sparkpost.com')
            .post('/api/v1/transmissions', (body) => {
                const expectedRequestBody = {
                    content: {
                        template_id: 'recover-password'
                    },
                    recipients: [
                        {
                            address: {
                                email: 'potato@gmail.com'
                            }
                        }
                    ],
                    substitution_data: {
                        fromName: 'RW API',
                        appName: 'RW API',
                        logo: 'https://resourcewatch.org/static/images/logo-embed.png'
                    }
                };

                body.should.have.property('substitution_data').and.be.an('object');
                body.substitution_data.should.have.property('urlRecover').and.include(`${process.env.PUBLIC_URL}/auth/reset-password/`);

                delete body.substitution_data.urlRecover;

                body.should.deep.equal(expectedRequestBody);

                return isEqual(body, expectedRequestBody);
            })
            .once()
            .reply(200);

        await new UserModel({
            email: 'potato@gmail.com'
        }).save();

        const response = await requester
            .post(`/auth/reset-password`)
            .set('Content-Type', 'application/json')
            .send({
                email: 'potato@gmail.com'
            });

        response.status.should.equal(200);
        response.header['content-type'].should.equal('application/json; charset=utf-8');
        response.body.should.have.property('message').and.equal(`Email sent`);
    });

    after(async () => {
        UserModel.deleteMany({}).exec();
        UserTempModel.deleteMany({}).exec();
        RenewModel.deleteMany({}).exec();

        closeTestAgent();
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
