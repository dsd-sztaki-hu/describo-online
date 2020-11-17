require("regenerator-runtime");
const restify = require("restify");
const server = restify.createServer();
const models = require("./src/models");
const { setupRoutes } = require("./src/routes");
const { loadConfiguration, getLogger } = require("./src/common");
const corsMiddleware = require("restify-cors-middleware");
const log = getLogger();

(async () => {
    let configuration;
    try {
        configuration = await loadConfiguration();
    } catch (error) {
        console.error("configuration.json not found - stopping now");
        process.exit();
    }
    await models.sequelize.sync();
    const io = require("socket.io")(server.server, {
        cors: {
            origin: configuration.api.socketIO.origin,
            methods: ["GET", "POST"],
            allowedHeaders: ["Authorization"],
            credentials: true,
        },
    });

    setupRoutes({ server, io });
    const cors = corsMiddleware({
        preflightMaxAge: 5, //Optional
        origins: ["*"],
        allowHeaders: [
            "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization",
        ],
        exposeHeaders: [
            "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization",
        ],
    });

    server.pre(restify.plugins.pre.dedupeSlashes());
    server.pre(cors.preflight);
    server.use(cors.actual);
    if (process.env.NODE_ENV === "development") {
        server.use((req, res, next) => {
            log.debug(`${req.route.method}: ${req.route.path}`);
            return next();
        });
    }
    server.use((req, res, next) => {
        req.io = io;
        return next();
    });
    server.use(restify.plugins.queryParser({ mapParams: false }));
    server.use(
        restify.plugins.bodyParser({
            maxBodySize: 0,
            mapParams: true,
            mapFiles: false,
            overrideParams: false,
            multiples: true,
            hash: "sha1",
            rejectUnknown: true,
            requestBodyOnGet: false,
            reviver: undefined,
            maxFieldsSize: 2 * 1024 * 1024,
        })
    );
    const app = server.listen(configuration.api.port, function () {
        console.log("ready on %s", server.url);
    });
})();
