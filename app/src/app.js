const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const koaBody = require('koa-body');
const config = require('config');
const mongoose = require('mongoose');
const loader = require('loader');
const path = require('path');
const convert = require('koa-convert');
const sleep = require('sleep');
const cors = require('@koa/cors');
const ErrorSerializer = require('serializers/errorSerializer');
const mongooseOptions = require('../../config/mongoose');

const mongoUri = process.env.CT_MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

const koaBodyMiddleware = koaBody({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb',
    formidable: {
        uploadDir: '/tmp',
        onFileBegin(name, file) {
            const folder = path.dirname(file.path);
            file.path = path.join(folder, file.name);
        },
    },
});

let retries = 10;

async function init() {
    return new Promise((resolve, reject) => {
        async function onDbReady(err) {
            if (err) {
                if (retries >= 0) {
                    // eslint-disable-next-line no-plusplus
                    retries--;
                    logger.error(`Failed to connect to MongoDB uri ${mongoUri}, retrying...`);
                    sleep.sleep(5);
                    mongoose.connect(mongoUri, mongooseOptions, onDbReady);
                } else {
                    logger.error('MongoURI', mongoUri);
                    logger.error(err);
                    reject(new Error(err));
                }

                return;
            }

            logger.info('Executing migration...');

            const app = new Koa();

            // catch errors and send in jsonapi standard. Always return vnd.api+json
            app.use(async (ctx, next) => {
                try {
                    await next();
                } catch (inErr) {
                    let error = inErr;
                    try {
                        error = JSON.parse(inErr);
                    } catch (e) {
                        logger.debug('Could not parse error message - is it JSON?: ', inErr);
                        error = inErr;
                    }
                    ctx.status = error.status || ctx.status || 500;
                    if (ctx.status >= 500) {
                        logger.error(error);
                    } else {
                        logger.info(error);
                    }

                    ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
                    if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
                        ctx.body = 'Unexpected error';
                    }
                    ctx.response.type = 'application/vnd.api+json';
                }
            });

            app.use(cors({
                credentials: true
            }));

            app.use(convert(koaBodyMiddleware));
            app.use(koaLogger());

            loader.loadRoutes(app);
            app.use(require('routes/dispatcher.js')
                .middleware()); // eslint-disable-line global-require

            const server = app.listen(process.env.PORT);
            logger.info('Server started in ', process.env.PORT);
            resolve({
                app,
                server
            });
        }

        logger.info(`Connecting to MongoDB URL ${mongoUri}`);
        mongoose.connect(mongoUri, mongooseOptions, onDbReady);
    });
}

module.exports = init;
