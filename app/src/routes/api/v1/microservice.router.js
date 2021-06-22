const Router = require('koa-router');
const MicroserviceModel = require('models/microservice.model');
const logger = require('logger');
const Utils = require('utils');
const mongoose = require('mongoose');
const MicroserviceSerializer = require('serializers/microservice.serializer');
const pick = require('lodash/pick');
const { getLoggedUser } = require('services/getUserFromToken.service');

const router = new Router({
    prefix: '/microservice',
});

class MicroserviceRouter {

    static async getAll(ctx) {
        const query = pick(ctx.query, ['url']);

        logger.info('[MicroserviceRouter] Obtaining registered microservices list');
        ctx.body = await MicroserviceModel.find({ ...query }, { __v: 0 });
    }

    static async get(ctx) {
        const { id } = ctx.params;
        logger.info(`[MicroserviceRouter] Obtaining microservice with id ${id}`);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            ctx.throw(404, `Could not find a microservice with id ${id}`);
            return;
        }
        const microservice = await MicroserviceModel.findById(id, { __v: 0 });

        if (!microservice) {
            ctx.throw(404, `Could not find a microservice with id ${id}`);
            return;
        }

        ctx.body = MicroserviceSerializer.serialize(microservice);
    }

}

router.get('/', getLoggedUser, Utils.isLogged, Utils.isAdmin, MicroserviceRouter.getAll);
router.get('/:id', getLoggedUser, Utils.isLogged, Utils.isAdmin, MicroserviceRouter.get);

module.exports = router;
