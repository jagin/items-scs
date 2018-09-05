const { expect } = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const { describe, it } = lab

describe('unit test', () => {
  it('shoud test this', () => {
    expect(true).to.equal(true)
  })

  it('shoud test that', () => {
    expect(true).to.equal(true)
  })
})
