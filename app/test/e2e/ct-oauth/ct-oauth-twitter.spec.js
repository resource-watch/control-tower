const nock = require('nock');
const chai = require('chai');

const UserModel = require('plugins/sd-ct-oauth-plugin/models/user.model');

const { getTestAgent, closeTestAgent } = require('../test-server');
const { setPluginSetting } = require('../utils/helpers');

const should = chai.should();
chai.use(require('chai-string'));

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('Twitter auth endpoint tests', () => {

    // eslint-disable-next-line func-names
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        // We need to force-start the server, to ensure mongo has plugin info we can manipulate in the next instruction
        await getTestAgent(true);

        await setPluginSetting('oauth', 'config.defaultApp', 'rw');
        await setPluginSetting('oauth', 'config.thirdParty.rw.twitter.active', true);
        await setPluginSetting('oauth', 'config.thirdParty.rw.twitter.consumerSecret', 'process.env.TEST_TWITTER_OAUTH2_CONSUMER_KEY');
        await setPluginSetting('oauth', 'config.thirdParty.rw.twitter.consumerKey', 'process.env.TEST_TWITTER_OAUTH2_CONSUMER_SECRET');

        requester = await getTestAgent(true);

        await UserModel.deleteMany({})
            .exec();

        nock.cleanAll();
    });

    beforeEach(async () => {
        requester = await getTestAgent(true);
    });

    it('Visiting /auth/twitter while not being logged in should redirect to the twitter login page', async () => {
        nock('https://api.twitter.com')
            .post('/oauth/request_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&oauth_callback_confirmed=true');

        const response = await requester
            .get(`/auth/twitter`)
            .redirects(0);

        response.status.should.equal(302);
        response.header['content-type'].should.equalIgnoreCase('text/plain; charset=UTF-8');
        response.should.redirectTo('https://api.twitter.com/oauth/authenticate?oauth_token=OAUTH_TOKEN');
    });

    it('Visiting /auth/twitter/callback while not being logged in should redirect to the twitter login page', async () => {
        nock('https://api.twitter.com')
            .post('/oauth/request_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&oauth_callback_confirmed=true');

        const response = await requester
            .get(`/auth/twitter/callback`)
            .redirects(0);

        response.status.should.equal(302);
        response.header['content-type'].should.equalIgnoreCase('text/plain; charset=UTF-8');
        response.should.redirectTo('https://api.twitter.com/oauth/authenticate?oauth_token=OAUTH_TOKEN');
    });

    it('Visiting /auth/twitter/callback with the correct oauth data should create the user account on the DB and redirect to the success page', async () => {
        const missingUser = await UserModel.findOne({ email: 'john.doe@vizzuality.com' })
            .exec();
        should.not.exist(missingUser);

        nock('https://api.twitter.com')
            .get('/oauth/authenticate?oauth_token=OAUTH_TOKEN')
            .reply(200, '<html>hello world</html>');

        nock('https://api.twitter.com', { encodedQueryParams: true })
            .post('/oauth/request_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&oauth_callback_confirmed=true');

        nock('https://api.twitter.com:443', { encodedQueryParams: true })
            .post('/oauth/access_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&user_id=281468859&screen_name=tiagojsag');

        nock('https://api.twitter.com:443', { encodedQueryParams: true })
            .get('/1.1/account/verify_credentials.json')
            .query({ include_email: 'true' })
            .reply(200, {
                id: 113994825016233013735,
                id_str: '113994825016233013735',
                name: 'John Doe',
                screen_name: 'johndoe',
                location: 'Mars',
                description: 'Web developer at @vizzuality',
                url: null,
                entities: { description: { urls: [] } },
                protected: false,
                followers_count: 213,
                friends_count: 507,
                listed_count: 13,
                created_at: 'Wed Apr 13 10:33:09 +0000 2011',
                favourites_count: 626,
                utc_offset: null,
                time_zone: null,
                geo_enabled: false,
                verified: false,
                statuses_count: 1497,
                lang: null,
                contributors_enabled: false,
                is_translator: false,
                is_translation_enabled: false,
                profile_background_color: 'EBEBEB',
                profile_background_image_url: 'http://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_background_image_url_https: 'https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_background_tile: false,
                profile_image_url: 'http://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_image_url_https: 'https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_link_color: '990000',
                profile_sidebar_border_color: 'DFDFDF',
                profile_sidebar_fill_color: 'F3F3F3',
                profile_text_color: '333333',
                profile_use_background_image: true,
                has_extended_profile: false,
                default_profile: false,
                default_profile_image: false,
                following: false,
                follow_request_sent: false,
                notifications: false,
                translator_type: 'none',
                suspended: false,
                needs_phone_verification: false,
                email: 'john.doe@vizzuality.com'
            });

        await requester
            .get(`/auth/twitter`);

        const response = await requester
            .get(`/auth/twitter/callback?oauth_token=OAUTH_TOKEN&oauth_verifier=OAUTH_TOKEN_VERIFIER`)
            .redirects(2);

        response.should.redirect;
        response.should.redirectTo(/\/auth\/success$/);

        const confirmedUser = await UserModel.findOne({ email: 'john.doe@vizzuality.com' })
            .exec();
        should.exist(confirmedUser);
        confirmedUser.should.have.property('email')
            .and
            .equal('john.doe@vizzuality.com');
        confirmedUser.should.have.property('name')
            .and
            .equal('John Doe');
        confirmedUser.should.have.property('photo')
            .and
            .equal('https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260');
        confirmedUser.should.have.property('role')
            .and
            .equal('USER');
        confirmedUser.should.have.property('provider')
            .and
            .equal('twitter');
        confirmedUser.should.have.property('providerId')
            .and
            .equal('113994825016233013735');
    });

    it('Visiting /auth/twitter/callback with a callback url and the correct oauth data should create the user account on the DB and redirect to the provided callback url', async () => {
        const missingUser = await UserModel.findOne({ email: 'john.doe@vizzuality.com' })
            .exec();
        should.not.exist(missingUser);

        nock('https://api.twitter.com')
            .get('/oauth/authenticate?oauth_token=OAUTH_TOKEN')
            .reply(200, '<html>hello world</html>');

        nock('https://api.twitter.com', { encodedQueryParams: true })
            .post('/oauth/request_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&oauth_callback_confirmed=true');

        nock('https://api.twitter.com:443', { encodedQueryParams: true })
            .post('/oauth/access_token')
            .reply(200, 'oauth_token=OAUTH_TOKEN&oauth_token_secret=OAUTH_TOKEN_SECRET&user_id=281468859&screen_name=tiagojsag');

        nock('https://api.twitter.com:443', { encodedQueryParams: true })
            .get('/1.1/account/verify_credentials.json')
            .query({ include_email: 'true' })
            .reply(200, {
                id: 113994825016233013735,
                id_str: '113994825016233013735',
                name: 'John Doe',
                screen_name: 'johndoe',
                location: 'Mars',
                description: 'Web developer at @vizzuality',
                url: null,
                entities: { description: { urls: [] } },
                protected: false,
                followers_count: 213,
                friends_count: 507,
                listed_count: 13,
                created_at: 'Wed Apr 13 10:33:09 +0000 2011',
                favourites_count: 626,
                utc_offset: null,
                time_zone: null,
                geo_enabled: false,
                verified: false,
                statuses_count: 1497,
                lang: null,
                contributors_enabled: false,
                is_translator: false,
                is_translation_enabled: false,
                profile_background_color: 'EBEBEB',
                profile_background_image_url: 'http://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_background_image_url_https: 'https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_background_tile: false,
                profile_image_url: 'http://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_image_url_https: 'https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260',
                profile_link_color: '990000',
                profile_sidebar_border_color: 'DFDFDF',
                profile_sidebar_fill_color: 'F3F3F3',
                profile_text_color: '333333',
                profile_use_background_image: true,
                has_extended_profile: false,
                default_profile: false,
                default_profile_image: false,
                following: false,
                follow_request_sent: false,
                notifications: false,
                translator_type: 'none',
                suspended: false,
                needs_phone_verification: false,
                email: 'john.doe@vizzuality.com'
            });

        nock('https://foo.bar')
            .get('/')
            .reply(200, 'redirect url page body');

        await requester
            .get(`/auth/twitter?callbackUrl=https://foo.bar`);

        const response = await requester
            .get(`/auth/twitter/callback?oauth_token=OAUTH_TOKEN&oauth_verifier=OAUTH_TOKEN_VERIFIER`);

        response.text.should.equal('redirect url page body');

        const confirmedUser = await UserModel.findOne({ email: 'john.doe@vizzuality.com' })
            .exec();
        should.exist(confirmedUser);
        confirmedUser.should.have.property('email')
            .and
            .equal('john.doe@vizzuality.com');
        confirmedUser.should.have.property('name')
            .and
            .equal('John Doe');
        confirmedUser.should.have.property('photo')
            .and
            .equal('https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260');
        confirmedUser.should.have.property('role')
            .and
            .equal('USER');
        confirmedUser.should.have.property('provider')
            .and
            .equal('twitter');
        confirmedUser.should.have.property('providerId')
            .and
            .equal('113994825016233013735');
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        UserModel.deleteMany({})
            .exec();

        closeTestAgent();
    });
});
