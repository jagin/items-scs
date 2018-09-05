const { expect } = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const { beforeEach, afterEach, describe, it } = lab

const Sinon = require('sinon')
const JWT = require('jsonwebtoken')

const Glue = require('glue')

let server
let sandbox

const JWT_KEY = 'jwt-secret-key'

beforeEach(async () => {
  sandbox = Sinon.createSandbox()

  const manifest = {
    register: {
      plugins: [
        { plugin: 'hapi-auth-jwt2' },
        {
          plugin: './auth',
          options: {
            jwt: {
              key: JWT_KEY
            }
          }
        },
        { plugin: './api' }
      ]
    }
  }
  server = await Glue.compose(manifest, { relativeTo: '../../../server' })
  await server.initialize()
})

afterEach(() => {
  sandbox.restore()
})

describe('API', () => {
  describe('GET /api/items', () => {
    it('should return http status 200 with items', async () => {
      const items = [{
        _id: '1',
        name: 'Item 1'
      }, {
        _id: '2',
        name: 'Item 2'
      }]

      server.method('Database.Repository.Items.find', sandbox.stub().resolves(items))

      const response = await server.inject({
        method: 'GET',
        url: '/api/items'
      })

      expect(response.statusCode).to.equal(200)
      expect(server.methods.Database.Repository.Items.find.calledOnce).to.be.true()
      expect(server.methods.Database.Repository.Items.find.calledWith({
        pagination: {
          page: 1,
          limit: 10
        }
      })).to.be.true()
      expect(response.result).to.equal(items)
    })
  })

  describe('GET /api/items/{id}', () => {
    it('should return http status 200 with item', done => {
      const item = {
        _id: '1',
        name: 'Item 1',
        tags: ['tag1', 'tag2']
      }
      const options = {
        method: 'GET',
        url: `/api/items/${item._id}`
      }

      server.method('Database.Repository.Items.findById', sandbox.stub().resolves(item))

      server.inject(options, response => {
        expect(response.statusCode).to.equal(200)
        expect(server.methods.Database.Repository.Items.findById.calledOnce).to.be.true()
        expect(server.methods.Database.Repository.Items.findById.calledWith(item._id)).to.be.true()
        expect(response.result).to.equal(item)
        done()
      })
    })

    it('should return http status 404', done => {
      const options = {
        method: 'GET',
        url: `/api/items/1`
      }

      server.method('Database.Repository.Items.findById', sandbox.stub().resolves(null))

      server.inject(options, response => {
        expect(response.statusCode).to.equal(404)
        done()
      })
    })
  })

  describe('POST /api/items', () => {
    it('should return http status 201 with created item', done => {
      const payload = {
        name: 'Item 1',
        tags: ['tag1', 'tag2']
      }
      const item = {
        _id: '1',
        name: 'Item 1',
        tags: ['tag1', 'tag2']
      }
      var token = JWT.sign({ sub: '1234', name: 'Charlie' }, JWT_KEY)
      const options = {
        method: 'POST',
        url: `/api/items`,
        headers: { authorization: `Bearer ${token}` },
        payload
      }

      server.method('Database.Repository.Items.create', sandbox.stub().resolves(item))

      server.inject(options, response => {
        expect(response.statusCode).to.equal(201)
        expect(server.methods.Database.Repository.Items.create.calledOnce).to.be.true()
        expect(server.methods.Database.Repository.Items.create.calledWith(payload)).to.be.true()
        expect(response.result).to.equal(item)
        done()
      })
    })
  })
})
