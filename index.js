const path = require('path');
const Server = require('./lib/server.js');
const config = require('./config.json')['server'];

function preServerProcess(config, context) {
  const proxy = context.proxy;
  const serverEnv = process.env.SERVER_ENV;
  const cwd = process.cwd();

  context.setConfig({
    port: config.port,
    opnPath: config.opnPath[serverEnv] || '',
    livereload: { // livereload
      watch: path.join(cwd, config.livereload.watch),
      init: config.livereload.init || {}
    }
  });

  // proxy
  config.proxy.forEach((p) => {
    context.registerRouter(p.method, p.route, proxy(p.options));
  });
}


const arg = {
  cwd: '',
  port: 12345,
}
const serve = new Server(arg);
preServerProcess(config, serve);

serve.start();
