import { IncomingMessage } from 'http';
import { Service, ServiceBroker, Context } from 'moleculer';
import ApiGateway from 'moleculer-web';
import _ from 'lodash';
import type { UserJWTPayload } from './user/user.service';
import { PawSocketIOService } from '../mixins/socketio.mixin';
import { PawService } from './base';

export default class ApiService extends PawService {
  get serviceName() {
    return 'gateway';
  }

  onInit() {
    this.registerMixin(ApiGateway);
    this.registerMixin(PawSocketIOService());

    // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
    this.registerSetting('port', process.env.PORT || 11000);
    this.registerSetting('routes', this.getRoutes());
    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    this.registerSetting('log4XXResponses', false);
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    this.registerSetting('logRequestParams', null);
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    this.registerSetting('logResponseData', null);
    // Serve assets from "public" folder
    this.registerSetting('assets', {
      folder: 'public',
      // Options to `server-static` module
      options: {},
    });

    this.registerMethod('authorize', this.authorize);
  }

  getRoutes() {
    return [
      {
        path: '/api',
        whitelist: [
          // Access to any actions in all services under "/api" URL
          '**',
        ],
        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],
        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: false,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: true,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {
          health: '$node.health',
        },
        /**
         * Before call hook. You can check the request.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingMessage} req
         * @param {ServerResponse} res
         * @param {Object} data
        onBeforeCall(ctx: Context<any,{userAgent: string}>,
        route: object, req: IncomingMessage, res: ServerResponse) {
          Set request headers to context meta
          ctx.meta.userAgent = req.headers["user-agent"];
        },
        */

        /**
         * After call hook. You can modify the data.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingMessage} req
         * @param {ServerResponse} res
         * @param {Object} data
         *
        onAfterCall(ctx: Context, route: object, req: IncomingMessage, res: ServerResponse, data: object) {
          // Async function which return with Promise
          return doSomething(ctx, res, data);
        },
       */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB',
          },
          urlencoded: {
            extended: true,
            limit: '1MB',
          },
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: 'all', // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true,
      },
    ];
  }

  /**
   * jwt秘钥
   */
  get jwtSecretKey() {
    return process.env.PAW_JWT_SECRET || 'pawchat';
  }

  /**
   * 鉴权白名单
   */
  get authWhitelist() {
    return ['/user/login', '/user/register'];
  }

  async authorize(ctx: Context<{}, any>, route: unknown, req: IncomingMessage) {
    if (this.authWhitelist.includes(req.url)) {
      return null;
    }

    const token = req.headers['x-token'] as string;

    if (typeof token !== 'string') {
      throw new ApiGateway.Errors.UnAuthorizedError(
        ApiGateway.Errors.ERR_NO_TOKEN,
        {
          error: 'No Token',
        }
      );
    }

    // Verify JWT token
    try {
      const user: UserJWTPayload = await ctx.call('user.resolveToken', {
        token,
      });

      if (user && user._id) {
        this.logger.info('Authenticated via JWT: ', user.username);
        // Reduce user fields (it will be transferred to other nodes)
        ctx.meta.user = _.pick(user, ['_id', 'username', 'email', 'avatar']);
        ctx.meta.token = token;
        ctx.meta.userId = user._id;
      } else {
        throw new Error('Token不合规');
      }
    } catch (err) {
      throw new ApiGateway.Errors.UnAuthorizedError(
        ApiGateway.Errors.ERR_INVALID_TOKEN,
        {
          error: 'Invalid Token:' + String(err),
        }
      );
    }
  }
}
