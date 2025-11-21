module.exports = {
  apps: [
    {
      name: 'nrm-upload-server',
      script: './server/server.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      // set ADMIN_KEY here or override with your environment for security
      env_production: {
        ADMIN_KEY: '12345'
      },
      env_development: {
        NODE_ENV: 'development'
      }
    }
    ,
    {
      name: 'nrm-frontend',
      script: './serve_frontend.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
