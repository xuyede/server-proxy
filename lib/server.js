const opn = require('opn');
const path = require('path');
const http = require('http');
const browserSync = require('browser-sync');
const Koa = require('koa');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const koaProxy = require('koa-proxy');
const Router = require('@koa/router');

class Server {
  constructor(options) {
    this.$options = options;
    this.cwd = options.cwd || '';
    this.port = options.port;

    this.app = new Koa();

    this.config = {};
    // router && proxy
    this.routerStore = [];
    this.proxy = koaProxy;
  }

  init () {
    const currentPath = path.join(process.cwd(), this.cwd);

    // static serve
    this.app.use(serve(currentPath));
  }

  setConfig(options) {
    Object.assign(this.config, options);
  }

  registerRouter(method, route, middlewares) {
    if (arguments.length !== 3) {
      throw new Error('registerRouter params error.');
    }

    this.routerStore.push({
      path: route,
      method,
      middlewares
    })
  }

  browserSync(options) {
    const liveReloadConfig = this.config.livereload || {};
    const bs = browserSync.create();

    bs.init(Object.assign({
      https: this.$options.ssl,
      open: 'external',
      port: 12306,
      notify: false,
      proxy: options.proxy
    }, liveReloadConfig.init));

    bs.watch(liveReloadConfig.watch, {
      interval: 1000
    }).on('change', bs.reload);
  }

  start() {
    // init
    this.init();

    const router = new Router();
    // 处理代理请求 router
    const proxyRouter = new Router();
    const routerStore = this.routerStore;
    const opnPath = this.config.opnPath || '';

    routerStore.forEach(rs => {
      /**
          rs = {
            path: rpath, //route
            method,
            middlewares
          }
       */

      let middlewares = rs.middlewares;

      if (!Array.isArray(middlewares)) {
        middlewares = [middlewares];
      }

      // koa-proxy 执行返回的函数名称为 proxy
      const proxyFunc = middlewares.filter(fn => fn.name === 'proxy');
      if (proxyFunc.length > 0) {
        if (proxyFunc.length === middlewares.length) {
          // router.post('/proxy/Trans/', **处理中间件**);
          proxyRouter[rs.method](rs.path, ...middlewares);
        } else {
          throw new Error('不能同时存在proxy');
        }
      } else {
        router[rs.method](rs.path, ...middlewares);
      }
    })

    // 代理路由
    this.app.use(proxyRouter.routes()).use(proxyRouter.allowedMethods());
    // body parser
    this.app.use(bodyParser());
    // 正常路由
    this.app.use(router.routes()).use(router.allowedMethods());

    const port = parseInt(this.port, 10);
    let server = null;
    let listenURL = '';

    listenURL = `http://127.0.0.1:${port}`;
    server = http.createServer(this.app.callback());

    const opnURL = `${listenURL}${opnPath}`;

    server.listen(port, () => {
      console.log(`Server running at ${listenURL}`);
      this.browserSync({ proxy: opnURL })
    })
  }
}

module.exports = Server;
