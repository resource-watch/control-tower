const logger = require('logger');

function getUser(ctx) {
    return ctx.req.loggedUser || ctx.state.user;
}

function hasUser(ctx) {
    return ctx.header && ctx.header.authorization;
}

async function isLogged(ctx, next) {
    logger.debug('Checking if user is logged');
    if (hasUser(ctx)) {
        await next();
    } else {
        logger.debug('Not logged');
        ctx.throw(401, 'Not authenticated');
    }
}

async function isAdmin(ctx, next) {
    logger.debug('Checking if user is admin');
    const user = getUser(ctx);
    if (user && user.role === 'ADMIN') {
        await next();
    } else {
        logger.debug('Not admin');
        ctx.throw(403, 'Not authorized');
    }
}

module.exports = {
    isAdmin,
    isLogged,
};
