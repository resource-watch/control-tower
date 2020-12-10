const logger = require('logger');
const axios = require('axios');

const getLoggedUser = async (ctx, next) => {
    logger.debug('[getLoggedUser] Obtaining loggedUser for token');
    if (!ctx.request.header.authorization) {
        logger.debug('[getLoggedUser] No authorization header found, returning');
        ctx.throw(401, 'Not authenticated');
        return;
    }

    try {
        const getUserDetailsRequestConfig = {
            method: 'GET',
            baseURL: process.env.CT_URL,
            url: `/auth/user/me`,
            headers: {
                authorization: ctx.request.header.authorization
            }
        };

        const response = await axios(getUserDetailsRequestConfig);

        logger.debug('[getLoggedUser] Retrieved token data, response status:', response.status);

        ctx.state.user = response.data;
    } catch (err) {
        logger.error('Error getting user data', err);
        if (err.response && err.response.data) {
            throw new Error(err.response.status, err.response.data, err.response);
        }
        throw err;
    }

    await next();
};

module.exports = { getLoggedUser };
