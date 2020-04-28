const Router = require('koa-router');

const router = new Router({
    prefix: '/',
});

class RootRouter {

    static async getRoot(ctx) {
        ctx.body = {
            name: 'Resource Watch API',
            url: 'https://api.resourcewatch.org'
        };
    }

}

router.get('/', RootRouter.getRoot);

module.exports = router;
