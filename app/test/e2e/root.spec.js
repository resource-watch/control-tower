const { getTestAgent, closeTestAgent } = require('./test-server');

let requester;

describe('Root endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestAgent();
    });

    it('Doing a HEAD request to the API root should return a 200', async () => {
        const response = await requester
            .head('/api/v1/');

        response.status.should.equal(200);
    });

    it('Doing a GET request to the API root should return a 200', async () => {
        const response = await requester
            .get('/api/v1/');

        response.status.should.equal(200);
        response.body.should.have.property('name').and.equal('Resource Watch API');
        response.body.should.have.property('url').and.equal('https://api.resourcewatch.org');
    });

    after(closeTestAgent);
});
