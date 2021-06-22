/* eslint-disable import/no-dynamic-require  */
const logger = require('logger');
const fs = require('fs');
const { join } = require('path');
const mount = require('koa-mount');
const path = require('path');
const MicroserviceService = require('services/microservice.service');
const Dispatcher = require('services/dispatcher.service');

const routersPath = `${__dirname}/routes`;
const microservicesPath = join(`${__dirname}/../..`, `microservices`);

function loadMicroservices(microservicesDirPath) {
    const routesFiles = fs.readdirSync(microservicesDirPath);
    routesFiles.forEach((file) => {
        const filePath = `${microservicesDirPath}/${file}`;
        const { name } = path.parse(filePath);

        const microservice = JSON.parse(fs.readFileSync(filePath));

        const microserviceUrl = new URL(process.env.LOCAL_URL);
        microserviceUrl.port = microservice.port;

        MicroserviceService.register(name, microserviceUrl.toString(), microservice.endpoints);
    });

    Dispatcher.reloadEndpoints();
}

function loadAPI(app, routersPath, pathApi) {
    const routesFiles = fs.readdirSync(routersPath);
    let existIndexRouter = false;
    routesFiles.forEach((file) => {
        const newPath = routersPath ? `${routersPath}/${file}` : file;
        const stat = fs.statSync(newPath);

        if (!stat.isDirectory()) {
            if (file.lastIndexOf('.router.js') !== -1) {
                if (file === 'index.router.js') {
                    existIndexRouter = true;
                } else {
                    logger.debug('Loading route %s, in path %s', newPath, pathApi);
                    if (pathApi) {
                        app.use(mount(pathApi, require(newPath)
                            .routes())); // eslint-disable-line global-require,max-len
                    } else {
                        app.use(require(newPath)
                            .routes()); // eslint-disable-line global-require,max-len
                    }
                }
            }
        } else {
            // is folder
            const newPathAPI = pathApi ? `${pathApi}/${file}` : `/${file}`;
            loadAPI(app, newPath, newPathAPI);
        }
    });
    if (existIndexRouter) {
        // load indexRouter when finish other Router
        const newPath = routersPath ? `${routersPath}/index.router.js` : 'index.router.js';
        logger.debug('Loading route %s, in path %s', newPath, pathApi);
        if (pathApi) {
            app.use(mount(pathApi, require(newPath)
                .routes())); // eslint-disable-line global-require,max-len
        } else {
            app.use(require(newPath)
                .routes()); // eslint-disable-line global-require,max-len
        }
    }
}

function loadRoutes(app) {
    logger.debug('Loading routes...');
    loadAPI(app, routersPath);
    if (process.env.NODE_ENV !== 'test') {
        logger.debug('Loading microservices...');
        loadMicroservices(microservicesPath);
    }
    logger.debug('Loaded routes and microservices correctly!');
}

module.exports = {
    loadRoutes
};
