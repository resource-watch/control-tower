const Router = require('koa-router');
const Endpoint = require('models/endpoint.model');
const logger = require('logger');
const Utils = require('utils');
const FastlyPurge = require('fastly-purge');
const pick = require('lodash/pick');
const { getLoggedUser } = require('services/getUserFromToken.service');

const router = new Router({
    prefix: '/endpoint',
});

class EndpointRouter {

    static async getAll(ctx) {
        logger.info('Obtaining endpoints');
        const query = pick(ctx.query, ['binary', 'path', 'method']);

        ctx.body = await Endpoint.find({ ...query }, { __v: 0 });
    }

    static async purgeAll(ctx) {
        logger.info('Purge fastly');
        const fastlyPurge = new FastlyPurge(process.env.FASTLY_APIKEY);
        const SERVICE_ID = process.env.FASTLY_SERVICEID;
        await new Promise((resolve, reject) => {
            fastlyPurge.service(SERVICE_ID, (err) => {
                if (err) {
                    logger.error('Error purging', err);
                    // eslint-disable-next-line prefer-promise-reject-errors
                    reject({ message: err.message });
                }
                resolve();
            });
        });
        ctx.body = 'ok';

    }

}

router.get('/', getLoggedUser, Utils.isLogged, Utils.isAdmin, EndpointRouter.getAll);
router.delete('/purge-all', getLoggedUser, Utils.isLogged, Utils.isAdmin, EndpointRouter.purgeAll);

module.exports = router;
