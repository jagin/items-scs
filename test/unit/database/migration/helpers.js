const Code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const describe = lab.describe
const it = lab.it
const expect = Code.expect

const proxyquire = require('proxyquire')
const path = require('path')

const helpersPath = '../../../../server/database/migration/helpers'

function stubFs (dir) {
  return {
    readdir: (path, callback) => {
      callback(null, dir[path])
    },
    stat: (file, callback) => {
      callback(null, {
        isDirectory: () => Object.keys(dir).indexOf(file) !== -1
      })
    }
  }
}

function testReadDir (dir, expected) {
  const dirName = Object.keys(dir)[0]
  const helper = proxyquire(helpersPath, {
    'fs': stubFs(dir)
  })

  return helper.readDir(dirName).then(result => {
    expect(result).to.equal(expected)
  })
}

function testReadMigrationDirUp (migrationDir, lastMigrationName, targetMigrationName, expected) {
  const dirName = Object.keys(migrationDir)[0]
  const helper = proxyquire(helpersPath, {
    'fs': stubFs(migrationDir)
  })
  return helper.readMigrationDirUp(dirName, lastMigrationName, targetMigrationName).then(result => {
    expect(result).to.equal(expected)
  })
}

function testReadMigrationDirDown (migrationDir, lastMigrationName, targetMigrationName, expected) {
  const dirName = Object.keys(migrationDir)[0]
  const helper = proxyquire(helpersPath, {
    'fs': stubFs(migrationDir)
  })
  return helper.readMigrationDirDown(dirName, lastMigrationName, targetMigrationName).then(result => {
    expect(result).to.equal(expected)
  })
}

describe('Database migration helper', () => {
  const migrationDir = { '01-dir': [
    '02-file.js',
    '01-file.js',
    '03-file.js',
    '06-file.js',
    '05-file.js',
    '04-file.js'] }

  describe('readDir', () => {
    it('should return an array of directory files', done => {
      /* Directory under the test
        01-dir
        |- 01-file
        |- 02-file
        |- 03-file
        |- 02-dir
        |  |- 04-file
        |  |- 05-file
        |  |- 06-file
        |- 03-dir
           |- 07-file
           |- 08-file
           |- 09-file
           |- 04-dir
              |- 10-file
              |- 11-file
              |- 12-file
      */
      return testReadDir(
        { '01-dir': ['01-file.js', '02-file.js', '03-file.js', '02-dir', '03-dir'],
          [path.normalize('01-dir/02-dir')]: ['04-file.js', '05-file.js', '06-file.js'],
          [path.normalize('01-dir/03-dir')]: ['07-file.js', '08-file.js', '09-file.js', '04-dir'],
          [path.normalize('01-dir/03-dir/04-dir')]: ['10-file.js', '11-file.js', '12-file.js'] },
        [ path.normalize('01-dir/01-file.js'),
          path.normalize('01-dir/02-file.js'),
          path.normalize('01-dir/03-file.js'),
          path.normalize('01-dir/02-dir/04-file.js'),
          path.normalize('01-dir/02-dir/05-file.js'),
          path.normalize('01-dir/02-dir/06-file.js'),
          path.normalize('01-dir/03-dir/07-file.js'),
          path.normalize('01-dir/03-dir/08-file.js'),
          path.normalize('01-dir/03-dir/09-file.js'),
          path.normalize('01-dir/03-dir/04-dir/10-file.js'),
          path.normalize('01-dir/03-dir/04-dir/11-file.js'),
          path.normalize('01-dir/03-dir/04-dir/12-file.js') ])
    })
  })

  describe('readMigrationDirUp', () => {
    it('should return all update migrations array', done => {
      return testReadMigrationDirUp(
        migrationDir,
        null,
        null,
        [ { id: '01', name: '01-file', file: path.normalize('01-file.js') },
          { id: '02', name: '02-file', file: path.normalize('02-file.js') },
          { id: '03', name: '03-file', file: path.normalize('03-file.js') },
          { id: '04', name: '04-file', file: path.normalize('04-file.js') },
          { id: '05', name: '05-file', file: path.normalize('05-file.js') },
          { id: '06', name: '06-file', file: path.normalize('06-file.js') }])
    })

    it('should return update migrations array from lastMigrationName', done => {
      return testReadMigrationDirUp(
        migrationDir,
        '03-file',
        null,
        [ { id: '04', name: '04-file', file: path.normalize('04-file.js') },
          { id: '05', name: '05-file', file: path.normalize('05-file.js') },
          { id: '06', name: '06-file', file: path.normalize('06-file.js') } ])
    })

    it('should return update migrations array up to targetMigrationName', done => {
      return testReadMigrationDirUp(
        migrationDir,
        null,
        '05-file',
        [ { id: '01', name: '01-file', file: path.normalize('01-file.js') },
          { id: '02', name: '02-file', file: path.normalize('02-file.js') },
          { id: '03', name: '03-file', file: path.normalize('03-file.js') },
          { id: '04', name: '04-file', file: path.normalize('04-file.js') },
          { id: '05', name: '05-file', file: path.normalize('05-file.js') } ])
    })

    it('should return update migrations array from lastMigrationName up to targetMigrationName', done => {
      return testReadMigrationDirUp(
        migrationDir,
        '02-file',
        '05-file',
        [ { id: '03', name: '03-file', file: path.normalize('03-file.js') },
          { id: '04', name: '04-file', file: path.normalize('04-file.js') },
          { id: '05', name: '05-file', file: path.normalize('05-file.js') } ])
    })

    it('should return empty array for up-to-date migration', () => {
      return testReadMigrationDirUp(
        migrationDir,
        '06-file',
        null,
        [ ])
    })

    it('should throw error for unknown lastMigrationName', () => {
      const dirName = Object.keys(migrationDir)[0]
      const helper = proxyquire(helpersPath, {
        fs: stubFs(migrationDir)
      })

      return helper.readMigrationDirUp(dirName, '10-file')
        .catch((err) => {
          expect(err.message).to.equal('Migration name 10-file not found')
        })
    })

    it('should throw error for unknown targetMigrationName', () => {
      const dirName = Object.keys(migrationDir)[0]
      const helper = proxyquire(helpersPath, {
        fs: stubFs(migrationDir)
      })

      return helper.readMigrationDirUp(dirName, null, '10-file')
        .catch((err) => {
          expect(err.message).to.equal('Migration name 10-file not found')
        })
    })
  })

  describe('readMigrationDirDown', () => {
    it('should return downgrade migrations array from lastMigrationName', done => {
      return testReadMigrationDirDown(
        migrationDir,
        '03-file',
        null,
        [ { id: '03', name: '03-file', file: path.normalize('03-file.js') },
          { id: '02', name: '02-file', file: path.normalize('02-file.js') },
          { id: '01', name: '01-file', file: path.normalize('01-file.js') } ])
    })

    it('should return downgrade migrations array from lastMigrationName down to targetMigrationName', done => {
      return testReadMigrationDirDown(
        migrationDir,
        '05-file',
        '02-file',
        [ { id: '05', name: '05-file', file: path.normalize('05-file.js') },
          { id: '04', name: '04-file', file: path.normalize('04-file.js') },
          { id: '03', name: '03-file', file: path.normalize('03-file.js') },
          { id: '02', name: '02-file', file: path.normalize('02-file.js') } ])
    })

    it('should throw error for unknown lastMigrationName', () => {
      const dirName = Object.keys(migrationDir)[0]
      const helper = proxyquire(helpersPath, {
        fs: stubFs(migrationDir)
      })

      return helper.readMigrationDirDown(dirName, '10-file')
        .catch((err) => {
          expect(err.message).to.equal('Migration name 10-file not found')
        })
    })

    it('should throw error for unknown targetMigrationName', () => {
      const dirName = Object.keys(migrationDir)[0]
      const helper = proxyquire(helpersPath, {
        fs: stubFs(migrationDir)
      })

      return helper.readMigrationDirDown(dirName, null, '10-file')
        .catch((err) => {
          expect(err.message).to.equal('Migration name 10-file not found')
        })
    })
  })
})
