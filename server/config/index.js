const Joi = require('joi')
const Package = require('../../package')

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test'])
    .default('development'),
  HOST: Joi.string()
    .default('localhost'),
  PORT: Joi.number()
    .default(8000),
  DATABASE_URL: Joi.string()
    .required(),
  DATABASE_NAME: Joi.string()
    .required()
    .default('items-db'),
  JWT_KEY: Joi.string()
    .required(),
  JWT_AUDIENCE: Joi.string()
    .required(),
  JWT_ISSUER: Joi.string()
    .required()
}).unknown()
  .required()

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema)

const config = {
  scs: 'items',
  version: Package.version,
  env: envVars.NODE_ENV,
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test',
  isProduction: envVars.NODE_ENV === 'production',
  jwt: {
    key: envVars.JWT_KEY,
    audience: envVars.JWT_AUDIENCE,
    issuer: envVars.JWT_ISSUER
  }
}

config.manifest = {
  server: {
    app: config,
    host: envVars.HOST,
    port: envVars.PORT,
    routes: {
      cors: true
    },
    router: {
      stripTrailingSlash: true
    }
  },
  register: {
    plugins: [
      { plugin: 'inert' },
      { plugin: 'vision' },
      { plugin: 'hapi-auth-jwt2' },
      {
        plugin: './i18n',
        options: {
          supportedLngs: ['en', 'pl'],
          fallbackLng: config.isProduction ? 'en' : 'dev',
          saveMissing: config.isDevelopment
        }
      },
      {
        plugin: './auth',
        options: {
          jwt: {
            key: config.jwt.key,
            audience: config.jwt.audience,
            issuer: config.jwt.issuer,
            ignoreExpiration: !config.isProduction
          }
        }
      },
      { plugin: './assets' },
      {
        plugin: './database',
        options: {
          url: envVars.DATABASE_URL,
          name: envVars.DATABASE_NAME,
          poolSize: 10
        }
      },
      { plugin: './database/repository' },
      { plugin: './api' },
      { plugin: './views' },
      {
        plugin: './metrics',
        options: {
          ignorePaths: [
            '/.well-known',
            '/assets'
          ]
        }
      },
      { plugin: './health-check' },
      {
        plugin: 'good',
        options: {
          ops: { interval: 60000 },
          reporters: {
            console: [
              { module: 'good-squeeze', name: 'Squeeze', args: [{ log: '*', request: '*', response: '*', error: '*' }] },
              { module: 'good-console' },
              'stdout'
            ]
          }
        }
      }
    ]
  }
}

if (!config.isProduction) {
  config.manifest.register.plugins.push({
    plugin: 'blipp'
  })

  config.manifest.register.plugins.push({
    plugin: 'hapi-swagger',
    options: {
      info: {
        version: config.version,
        title: 'Items API',
        description: 'This web API was built manipulate items through REST calls'
      },
      securityDefinitions: {
        jwt: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      },
      security: [{ jwt: [] }],
      auth: false,
      jsonPath: '/api/items/swagger.json',
      swaggerUIPath: '/api/items/swaggerui/',
      documentationPath: '/api/items/swagger'
    }
  })
} else {
  config.manifest.server.debug = false
}

config.validate = function () {
  if (error) {
    throw new Error(`Config validation error: ${error.message}`)
  }

  return this
}

module.exports = config
