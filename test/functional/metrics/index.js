const { expect } = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const { beforeEach, describe, it } = lab

const Glue = require('glue')

let server

beforeEach(async () => {
  const manifest = {
    register: {
      plugins: [
        { plugin: './metrics' }
      ]
    }
  }
  server = await Glue.compose(manifest, { relativeTo: '../../../server' })
  await server.initialize()
})

describe('GET /items/metrics', () => {
  it('return 200 HTTP status code', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/items/metrics'
    })

    expect(response.statusCode).to.equal(200)
  })
})
