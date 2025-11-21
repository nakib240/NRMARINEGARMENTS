// service-install-node-windows.js
// Installs two Windows services using the `node-windows` package:
//  - NRM-Backend -> server/server.js
//  - NRM-Frontend -> serve_frontend.js
// Usage: run as Administrator
//   npm install node-windows --save
//   node service-install-node-windows.js

const path = require('path');
try {
  const Service = require('node-windows').Service;

  const projectRoot = __dirname;

  function makeService(name, script, envVars = []) {
    return new Service({
      name,
      description: `NRM service ${name}`,
      script: path.join(projectRoot, script),
      // set working directory to script folder
      cwd: path.dirname(path.join(projectRoot, script)),
      env: envVars,
    });
  }

  const adminKey = process.env.ADMIN_KEY || '12345';

  const backend = makeService('NRM-Backend', path.join('server', 'server.js'), [{ name: 'ADMIN_KEY', value: adminKey }]);
  const frontend = makeService('NRM-Frontend', 'serve_frontend.js', []);

  backend.on('install', () => {
    console.log('NRM-Backend installed. Starting...');
    backend.start();
  });
  backend.on('alreadyinstalled', () => console.log('NRM-Backend already installed'));
  backend.on('start', () => console.log('NRM-Backend started'));

  frontend.on('install', () => {
    console.log('NRM-Frontend installed. Starting...');
    frontend.start();
  });
  frontend.on('alreadyinstalled', () => console.log('NRM-Frontend already installed'));
  frontend.on('start', () => console.log('NRM-Frontend started'));

  console.log('Installing services (requires Administrator)...');
  backend.install();
  frontend.install();

} catch (err) {
  console.error('Failed to run service installer. Make sure node-windows is installed.');
  console.error(err && err.stack || err);
  process.exitCode = 1;
}
