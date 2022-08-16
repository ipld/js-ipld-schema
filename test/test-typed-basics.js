/* eslint-env mocha */

import { create } from 'ipld-schema/typed.js'
import chai from 'chai'
import { lint } from './lint.js'

const { assert } = chai

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Base kinds', () => {
  it('null', async () => {
    const typed = create({ types: {} }, 'Null')

    await lint(typed.toTyped)

    for (const obj of [101, 1.01, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'null'`)
    }
    assert.isNull(typed.toTyped(null))
  })

  it('int', async () => {
    const typed = create({ types: {} }, 'Int')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'int'`)
    }
    assert.strictEqual(typed.toTyped(101), 101)
    assert.strictEqual(typed.toTyped(-101), -101)
    assert.strictEqual(typed.toTyped(0), 0)
  })

  it('float', async () => {
    const typed = create({ types: {} }, 'Float')

    await lint(typed.toTyped)

    for (const obj of [null, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'float'`)
    }
    assert.strictEqual(typed.toTyped(1.01), 1.01)
    assert.strictEqual(typed.toTyped(-1.01), -1.01)
    // sad, but unavoidable
    assert.strictEqual(typed.toTyped(0), 0)
    assert.strictEqual(typed.toTyped(100), 100)
    assert.strictEqual(typed.toTyped(-100), -100)
  })

  it('string', async () => {
    const typed = create({ types: {} }, 'String')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'string'`)
    }
    assert.strictEqual(typed.toTyped('a string'), 'a string')
    assert.strictEqual(typed.toTyped(''), '')
  })

  it('bool', async () => {
    const typed = create({ types: {} }, 'Bool')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'bool'`)
    }
    assert.strictEqual(typed.toTyped(false), false)
    assert.strictEqual(typed.toTyped(true), true)
  })

  it('bytes', async () => {
    const typed = create({ types: {} }, 'Bytes')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'bytes'`)
    }
    let ua = Uint8Array.from([1, 2, 3])
    assert.strictEqual(typed.toTyped(ua), ua)
    ua = new Uint8Array(0)
    assert.strictEqual(typed.toTyped(ua), ua)
  })

  it('link', async () => {
    const typed = create({ types: {} }, 'Link')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, new Uint8Array(0), Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'link'`)
    }
    assert.strictEqual(typed.toTyped(fauxCid), fauxCid)
  })

  /* can't use recursive kind names
  it('list', async () => {
    const typed = create({ types: {} }, 'List')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'list'`)
    }
    assert.isTrue(typed.toTyped([1, 2, 3]))
    assert.isTrue(typed.toTyped([1, 'one', true, null]))
    assert.isTrue(typed.toTyped([]))
  })

  it('map', async () => {
    const typed = create({ types: {} }, 'Map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), [1, 2, 3], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'map'`)
    }
    assert.isTrue(typed.toTyped({ obj: 'yep' }))
    assert.isTrue(typed.toTyped({}))
    assert.isTrue(typed.toTyped(Object.create(null)))
  })
  */
})

describe('List types', () => {
  it('[String:String]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: 'String'
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:String]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = ['one']
    assert.strictEqual(typed.toTyped(list), list)
    list = ['one', 'two', 'three']
    assert.strictEqual(typed.toTyped(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
  })

  it('[String:Int]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: 'Int'
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:Int]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = [0]
    assert.strictEqual(typed.toTyped(list), list)
    list = [1, 2, 3]
    assert.strictEqual(typed.toTyped(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
  })

  it('[String:nullable String]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: 'String',
            valueNullable: true
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:String]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = ['one']
    assert.strictEqual(typed.toTyped(list), list)
    list = ['one', 'two', 'three']
    assert.strictEqual(typed.toTyped(list), list)
    list = ['one', null, 'three']
    assert.strictEqual(typed.toTyped(list), list)
    list = [null]
    assert.strictEqual(typed.toTyped(list), list)
    list = [null, null]
    assert.strictEqual(typed.toTyped(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
  })

  it('[String:&Any]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: { link: {} }
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:&Any]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    /** @type {any[]} */
    let list = [fauxCid, fauxCid, fauxCid]
    assert.strictEqual(typed.toTyped(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
  })
})

describe('Map types', () => {
  it('{String:String}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'String'
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), [1, 2, 3], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:String}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 1 }))
    assert.isUndefined(typed.toTyped({ o: 1, t: 2, th: 3 }))
    /** @type {any} */
    let map = { o: 'one' }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: 'one', t: 'two', th: 'three' }
    assert.strictEqual(typed.toTyped(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
  })

  it('{String:Int}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'Int'
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:Int}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    /** @type {any} */
    let map = { o: 1 }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: 1, t: 2, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
  })

  it('{String:&Any}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: { link: {} }
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:&Any}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    assert.isUndefined(typed.toTyped({ o: 1 }))
    assert.isUndefined(typed.toTyped({ o: 1, t: 2, th: 3 }))
    /** @type {any} */
    let map = { o: fauxCid }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: fauxCid, t: fauxCid, th: fauxCid }
    assert.strictEqual(typed.toTyped(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
  })

  it('{String:nullable Int}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'Int',
            valueNullable: true
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:Int}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    /** @type {any} */
    let map = { o: 1 }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: 1, t: 2, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: null }
    assert.strictEqual(typed.toTyped(map), map)
    map = { o: 1, t: null, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
  })

  it('map listpairs', async () => {
    /*
      type MapAsListpairs {String:String} representation listpairs
    */
    const typed = create({
      types: {
        MapAsListpairs: {
          map: {
            keyType: 'String',
            valueType: 'String',
            representation: { listpairs: {} }
          }
        }
      }
    }, 'MapAsListpairs')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:String}'`)
    }
    assert.isUndefined(typed.toTyped([1, 'obj']))
    assert.isUndefined(typed.toTyped([fauxCid]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    assert.isUndefined(typed.toTyped([1]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    assert.deepEqual(typed.toTyped([['o', 'one']]), { o: 'one' })
    assert.isUndefined(typed.toTyped([[1, 'one']]))
    assert.deepEqual(typed.toTyped([['o', 'one'], ['t', 'two'], ['th', 'three']]), { o: 'one', t: 'two', th: 'three' })
    assert.isUndefined(typed.toTyped([['o', 'one'], ['t', 'two'], ['th', fauxCid]]))
    assert.isUndefined(typed.toTyped([['o', 1], ['t', 2], ['th', 3]]))
    assert.deepEqual(typed.toTyped([]), {})
  })
})
