const Router = require('koa-router');
const Endpoint = require('models/endpoint.model');
const logger = require('logger');
const Utils = require('utils');
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

}

router.get('/', getLoggedUser, Utils.isLogged, Utils.isAdmin, EndpointRouter.getAll);

module.exports = router;
