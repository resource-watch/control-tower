const logger = require('logger');
const MicroserviceModel = require('models/microservice.model');
const EndpointModel = require('models/endpoint.model');
const crypto = require('crypto');
const pathToRegexp = require('path-to-regexp');

class Microservice {

    /**
     * Creates an Endpoint model instance based on the array format data provided by a microservice
     * when confirming registration.
     *
     * @param endpoint
     * @param microservice
     * @param version
     * @returns {Promise<void>}
     */
    static async saveEndpoint(endpoint, microservice) {
        logger.info(`[MicroserviceService] Saving endpoint ${endpoint.path}`);
        logger.debug(`[MicroserviceService] Searching if path ${endpoint.path} exists in endpoints`);
        endpoint.redirect.url = microservice.url;
        // searching
        const oldEndpoint = await EndpointModel.findOne({
            path: endpoint.path,
            method: endpoint.method,
        })
            .exec();
        if (oldEndpoint) {
            logger.debug(`[MicroserviceService] Path ${endpoint.path} exists. Checking if redirect with url ${endpoint.redirect.url} exists.`);
            const oldRedirect = await EndpointModel.findOne({
                path: endpoint.path,
                method: endpoint.method,
                'redirect.url': endpoint.redirect.url,
            })
                .exec();
            if (!oldRedirect) {
                logger.debug(`[MicroserviceService] Redirect doesn't exist`);
                endpoint.redirect.microservice = microservice.name;
                oldEndpoint.redirect.push(endpoint.redirect);
                oldEndpoint.updatedAt = new Date();
                await oldEndpoint.save();
            } else {
                logger.debug('[MicroserviceService] Redirect exists. Updating', oldRedirect);
                for (let i = 0, { length } = oldRedirect.redirect; i < length; i++) {
                    if (oldRedirect.redirect[i].url === endpoint.redirect.url) {
                        oldRedirect.microservice = microservice.name;
                        oldRedirect.redirect[i].method = endpoint.redirect.method;
                        oldRedirect.redirect[i].path = endpoint.redirect.path;
                    }
                }
                oldEndpoint.updatedAt = new Date();
                await oldRedirect.save();
            }

        } else {
            logger.debug(`[MicroserviceService] Path ${endpoint.path} doesn't exist. Registering new`);
            let pathKeys = [];
            const pathRegex = pathToRegexp(endpoint.path, pathKeys);
            if (pathKeys && pathKeys.length > 0) {
                pathKeys = pathKeys.map((key) => key.name);
            }
            logger.debug('[MicroserviceService] Saving new endpoint');
            logger.debug('[MicroserviceService] regesx', pathRegex);
            endpoint.redirect.microservice = microservice.name;
            await new EndpointModel({
                path: endpoint.path,
                method: endpoint.method,
                pathRegex,
                pathKeys,
                binary: endpoint.binary,
                redirect: [endpoint.redirect],
            }).save();
        }
    }

    /**
     * Given a microservice object, creates the individual Endpoint model instances corresponding to each endpoint.
     * Used once CT has successfully contacted the MS requesting to register.
     *
     * @param microservice
     * @param info
     * @returns {Promise<void>}
     */
    static async saveEndpointsForMicroservice(microservice, endpoints) {
        logger.info(`[MicroserviceService - saveEndpointsForMicroservice] Saving endpoints for microservice ${microservice.name}`);
        if (endpoints && endpoints.length > 0) {
            for (let i = 0, { length } = endpoints; i < length; i++) {
                await Microservice.saveEndpoint(endpoints[i], microservice);
            }
        }
    }

    /**
     * Loads details for a microservice.
     *
     * During the microservice registration process, the MS provides CT with an URL where it can reach the MS.
     * This is used both to confirm that the MS is reachable and available, as well to allow the MS to announce to CT its endpoints.
     *
     * This method contacts the MS at its announced URL and path, and saves the announced endpoints to the database
     *
     * Returns a boolean describing whether or not it was able to successfully contact the microservice at the announces URL.
     *
     * @param microservice
     * @returns {Promise<boolean>}
     */
    static async getMicroserviceInfo(microservice, endpoints) {
        logger.info(`[MicroserviceService - getMicroserviceInfo] Obtaining info of the microservice with name ${microservice.name}`);

        microservice.endpoints = endpoints;
        microservice.updatedAt = Date.now();

        logger.info(`[MicroserviceService - getMicroserviceInfo] Microservice info ready for microservice ${microservice.name}, saving...`);
        await microservice.save();
        await Microservice.saveEndpointsForMicroservice(microservice, endpoints);
        return true;
    }

    /**
     * Registers a microservice
     * Can be used for either a new microservice, or to re-register an already known one
     * Triggered by a call to CT made by the MS itself, on bootup
     *
     * If a MS has never registered before, this adds a new Microservice instance to the DB.
     * If it's known, its endpoints are flagged for delete, so we can have a clean slate
     *
     * It then tries to contact the MS on the URL it provided, and if successful, registers the announced endpoints.
     *
     * @param info
     * @returns {Promise<null>}
     */
    static async register(name, url, endpoints) {
        try {
            logger.info(`[MicroserviceRouter] Registering new microservice with name ${name} and url ${url}`);
            logger.debug('[MicroserviceRouter] Search if microservice already exist');
            const existingMicroservice = await MicroserviceModel.findOne({
                url,
            });
            let micro = null;
            if (existingMicroservice) {
                micro = await MicroserviceModel.findByIdAndUpdate(
                    existingMicroservice._id,
                    { new: true }
                );
            }

            try {
                if (existingMicroservice) {
                    logger.debug(`[MicroserviceRouter] Removing existing microservice endpoints prior to re-import.`);
                    // If the microservice already exists, we delete the existing data first, so we can have a clean slate to re-import.
                    await Microservice.removeEndpointsOfMicroservice(existingMicroservice);
                } else {
                    logger.debug(`[MicroserviceRouter] Creating new microservice`);

                    micro = await new MicroserviceModel({
                        name,
                        url,
                        token: crypto.randomBytes(20)
                            .toString('hex'),
                    }).save();

                }
                logger.debug(`[MicroserviceRouter] Creating microservice`);

                const correct = await Microservice.getMicroserviceInfo(micro, endpoints);
                if (correct) {
                    logger.info(`[MicroserviceRouter] Microservice ${micro.name} was reached successfully, setting status to 'active'`);
                    await micro.save();
                    logger.info(`[MicroserviceRouter] Microservice ${micro.name} activated successfully.`);
                } else {
                    logger.warn(`[MicroserviceRouter] Microservice ${micro.name} could not be reached on announced URL.`);
                }
            } catch (err) {
                logger.error(err);
            }
            return micro;
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    /**
     * Flags endpoints of a microservice for removal
     * - If an endpoint has another redirect, simply removes this MS's url from the redirects list, and updates the endpoint
     * - If an endpoint doesn't have any other redirect, removes the redirect or endpoint.
     *
     * @param microservice
     * @returns {Promise<void>}
     */
    static async removeEndpointsOfMicroservice(microservice) {
        logger.info(`[MicroserviceService - removeEndpointsOfMicroservice] Removing endpoints of microservice with url ${microservice.url}`);
        if (!microservice || !microservice.endpoints) {
            return;
        }

        for (let i = 0, { length } = microservice.endpoints; i < length; i++) {
            const endpoint = await EndpointModel.findOne({
                method: microservice.endpoints[i].method,
                path: microservice.endpoints[i].path
            })
                .exec();

            if (endpoint) {
                const redirects = endpoint.redirect.filter((redirect) => redirect.url !== microservice.url);
                if (redirects && redirects.length > 0) {
                    logger.info(`[MicroserviceService - removeEndpointsOfMicroservice] Updating endpoint: Path ${endpoint.path} | Method ${endpoint.method}`);
                    endpoint.redirect = redirects;
                    endpoint.updatedAt = new Date();
                    await endpoint.save();
                } else {
                    logger.info(`[MicroserviceService - removeEndpointsOfMicroservice] Endpoint empty. Removing endpoint: Path ${endpoint.path} | Method ${endpoint.method}`);
                    await EndpointModel.deleteOne({ _id: endpoint._id });
                }
            }
        }
    }

}

module.exports = Microservice;
