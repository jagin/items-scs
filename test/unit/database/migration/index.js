const Code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const proxyquire = require('proxyquire')
const Sinon = require('sinon')

const describe = lab.describe
const it = lab.it
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const expect = Code.expect

const migrationPath = '../../../../server/database/migration'

let sandbox
let clock
const now = new Date()

beforeEach(() => {
  sandbox = Sinon.sandbox.create()
  clock = Sinon.useFakeTimers(now.getTime())
})

afterEach(() => {
  sandbox.restore()
  clock.restore()
})

describe('Database migration', () => {
  describe('add', () => {
    it('should add migraton files', done => {
      const helpers = {
        saveFile: sandbox.stub().resolves()
      }
      const migration = proxyquire(migrationPath, {
        './helpers': helpers
      })
      const id = now.getTime().toString()
      const migrationName = 'migration-name'
      const expected = {
        id: id,
        name: `${id}-${migrationName}`
      }

      return migration.add(migrationName).then(result => {
        expect(result).to.equal(expected)
        expect(helpers.saveFile.calledOnce).to.be.true()
      })
    })
  })
})
