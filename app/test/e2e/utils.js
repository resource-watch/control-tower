const Plugin = require('models/plugin.model');
const mongoose = require('mongoose');
const config = require('config');
const ObjectId = require('mongoose').Types.ObjectId;
const { TOKENS, endpointTest } = require('./test.constants');
const Endpoint = require('models/endpoint.model');
const Version = require('models/version.model');
const appConstants = require('app.constants');

const mongoUri = process.env.CT_MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;
const getUUID = () => Math.random().toString(36).substring(7);

const createUser = (apps = ['rw']) => ({
    _id: new ObjectId(),
    email: 'microservice@control-tower.com',
    password: '$password.hash',
    salt: '$password.salt',
    extraUserData: {
        apps
    },
    createdAt: '2019-02-12T10:27:24.001Z',
    role: 'USER',
    provider: 'local',
    userToken: 'myUserToken'
});

const initHelpers = () => {
    let requester;

    const setRequester = req => (requester = req);

    const isAdminOnly = (method, url) => async () => {
        const { USER, MANAGER } = TOKENS;
        const request = token => requester
            [method](`/api/v1/${url}`)
            .set('Authorization', `Bearer ${token}`)
            .send();

        const validate = res => {
            res.status.should.equal(403);
            res.body.errors[0].should.have.property('detail').and.equal('Not authorized');
        };

        const responses = await Promise.all([request(USER), request(MANAGER)]);
        responses.map(validate);
    };

    const isTokenRequired = (method, url) => async () => {
        const response = await requester[method](`/api/v1/${url}`).send();

        response.body.errors[0].should.have.property('detail').and.equal('Not authenticated');
        response.status.should.equal(401);
    };

    return {
        isAdminOnly,
        isTokenRequired,
        setRequester,
    };
};

const ensureCorrectError = ({ body }, errMessage, expectedStatus) => {
    body.should.have.property('errors').and.be.an('array');
    body.errors[0].should.have.property('detail').and.equal(errMessage);
    body.errors[0].should.have.property('status').and.equal(expectedStatus);
};

const updateVersion = () => Version.update({
    name: appConstants.ENDPOINT_VERSION,
}, {
    $set: {
        lastUpdated: new Date(),
    }
});

const createEndpoint = endpoint => new Endpoint({ ...endpointTest, ...endpoint }).save();

async function setPluginSetting(pluginName, settingKey, settingValue) {
    return new Promise((resolve, reject) => {
        async function onDbReady(err) {
            if (err) {
                reject(new Error(err));
            }

            const plugin = await Plugin.findOne({ name: pluginName }).exec();
            if (!plugin) {
                reject(`Plugin '${pluginName}' could not be found.`);
            }

            const newConfig = {};
            const pluginObjectKey = `config.${settingKey}`;
            newConfig[pluginObjectKey] = settingValue;

            return Plugin.updateOne({ name: pluginName }, { $set: newConfig }).exec().then(resolve);
        }

        mongoose.connect(mongoUri, { useNewUrlParser: true }, onDbReady);
    });
}

module.exports = {
    createUser,
    setPluginSetting,
    updateVersion,
    getUUID,
    ensureCorrectError,
    initHelpers,
    createEndpoint
};
