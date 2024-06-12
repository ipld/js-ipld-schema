/* eslint-env mocha */

import { assert } from 'chai'
import { buildAndVerify } from './typed-util.js'

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Base kinds', () => {
  it('null', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Null')
    for (const obj of [101, 1.01, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'null'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'null'`)
    }
    assert.isNull(typed.toTyped(null))
    assert.isNull(typed.toRepresentation(null))
  })

  it('int', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Int')

    for (const obj of [null, 1.01, -0.1, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'int'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'int'`)
    }
    assert.strictEqual(typed.toTyped(101), 101)
    assert.strictEqual(typed.toTyped(-101), -101)
    assert.strictEqual(typed.toTyped(0), 0)
    assert.strictEqual(typed.toRepresentation(101), 101)
    assert.strictEqual(typed.toRepresentation(-101), -101)
    assert.strictEqual(typed.toRepresentation(0), 0)
  })

  it('float', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Float')

    for (const obj of [null, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'float'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'float'`)
    }
    assert.strictEqual(typed.toTyped(1.01), 1.01)
    assert.strictEqual(typed.toTyped(-1.01), -1.01)
    // sad, but unavoidable
    assert.strictEqual(typed.toTyped(0), 0)
    assert.strictEqual(typed.toTyped(100), 100)
    assert.strictEqual(typed.toTyped(-100), -100)

    assert.strictEqual(typed.toRepresentation(1.01), 1.01)
    assert.strictEqual(typed.toRepresentation(-1.01), -1.01)
    assert.strictEqual(typed.toRepresentation(0), 0)
    assert.strictEqual(typed.toRepresentation(100), 100)
    assert.strictEqual(typed.toRepresentation(-100), -100)
  })

  it('string', async () => {
    const typed = await buildAndVerify({ types: {} }, 'String')

    for (const obj of [null, 1.01, -0.1, 101, -101, false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'string'`)
    }
    assert.strictEqual(typed.toTyped('a string'), 'a string')
    assert.strictEqual(typed.toTyped(''), '')
    assert.strictEqual(typed.toRepresentation('a string'), 'a string')
    assert.strictEqual(typed.toRepresentation(''), '')
  })

  it('bool', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Bool')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'bool'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'bool'`)
    }
    assert.strictEqual(typed.toTyped(false), false)
    assert.strictEqual(typed.toTyped(true), true)
    assert.strictEqual(typed.toRepresentation(false), false)
    assert.strictEqual(typed.toRepresentation(true), true)
  })

  it('bytes', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Bytes')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'bytes'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'bytes'`)
    }
    let ua = Uint8Array.from([1, 2, 3])
    assert.strictEqual(typed.toTyped(ua), ua)
    assert.strictEqual(typed.toRepresentation(ua), ua)
    ua = new Uint8Array(0)
    assert.strictEqual(typed.toTyped(ua), ua)
    assert.strictEqual(typed.toRepresentation(ua), ua)
  })

  it('link', async () => {
    const typed = await buildAndVerify({ types: {} }, 'Link')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, new Uint8Array(0), Uint8Array.from([1, 2, 3]), [1, 2, 3], { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != 'link'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != 'link'`)
    }
    assert.strictEqual(typed.toTyped(fauxCid), fauxCid)
    assert.strictEqual(typed.toRepresentation(fauxCid), fauxCid)
  })
})

describe('List types', () => {
  it('[String:String]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: 'String'
          }
        }
      }
    }, '$list')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:String]'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '[String:String]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    assert.isUndefined(typed.toRepresentation([1, 'one', true]))
    assert.isUndefined(typed.toRepresentation([0]))
    assert.isUndefined(typed.toRepresentation([1, 2, 3]))
    assert.isUndefined(typed.toRepresentation([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = ['one']
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = ['one', 'two', 'three']
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
  })

  it('[String:Int]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: 'Int'
          }
        }
      }
    }, '$list')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:Int]'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '[String:Int]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    assert.isUndefined(typed.toRepresentation([1, 'one', true]))
    assert.isUndefined(typed.toRepresentation(['one']))
    assert.isUndefined(typed.toRepresentation(['one', 'two', 'three']))
    assert.isUndefined(typed.toRepresentation([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = [0]
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = [1, 2, 3]
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
  })

  it('[String:nullable String]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: 'String',
            valueNullable: true
          }
        }
      }
    }, '$list')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:String]'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '[String:String]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    assert.isUndefined(typed.toRepresentation([1, 'one', true]))
    assert.isUndefined(typed.toRepresentation([0]))
    assert.isUndefined(typed.toRepresentation([1, 2, 3]))
    assert.isUndefined(typed.toRepresentation([fauxCid, fauxCid, fauxCid]))
    /** @type {any[]} */
    let list = ['one']
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = ['one', 'two', 'three']
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = ['one', null, 'three']
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = [null]
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = [null, null]
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
  })

  it('[String:&Any]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: { link: {} }
          }
        }
      }
    }, '$list')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), { obj: 'nope' }, undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '[String:&Any]'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '[String:&Any]'`)
    }
    assert.isUndefined(typed.toTyped([1, 'one', true]))
    assert.isUndefined(typed.toTyped([0]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    assert.isUndefined(typed.toRepresentation([1, 'one', true]))
    assert.isUndefined(typed.toRepresentation([0]))
    assert.isUndefined(typed.toRepresentation([1, 2, 3]))
    assert.isUndefined(typed.toRepresentation(['one']))
    assert.isUndefined(typed.toRepresentation(['one', 'two', 'three']))
    /** @type {any[]} */
    let list = [fauxCid, fauxCid, fauxCid]
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    list = []
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
  })
})

describe('Map types', () => {
  it('{String:String}', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'String'
          }
        }
      }
    }, '$map')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), [1, 2, 3], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:String}'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '{String:String}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 1 }))
    assert.isUndefined(typed.toTyped({ o: 1, t: 2, th: 3 }))
    assert.isUndefined(typed.toRepresentation({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: 1 }))
    assert.isUndefined(typed.toRepresentation({ o: 1, t: 2, th: 3 }))
    /** @type {any} */
    let map = { o: 'one' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: 'one', t: 'two', th: 'three' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('{String:Int}', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'Int'
          }
        }
      }
    }, '$map')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:Int}'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '{String:Int}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    assert.isUndefined(typed.toRepresentation({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: 'one' }))
    assert.isUndefined(typed.toRepresentation({ o: 'one', t: 'two', th: 'three' }))
    /** @type {any} */
    let map = { o: 1 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: 1, t: 2, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('{String:&Any}', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: { link: {} }
          }
        }
      }
    }, '$map')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:&Any}'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '{String:&Any}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    assert.isUndefined(typed.toTyped({ o: 1 }))
    assert.isUndefined(typed.toTyped({ o: 1, t: 2, th: 3 }))
    assert.isUndefined(typed.toRepresentation({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toRepresentation({ o: 'one' }))
    assert.isUndefined(typed.toRepresentation({ o: 'one', t: 'two', th: 'three' }))
    assert.isUndefined(typed.toRepresentation({ o: 1 }))
    assert.isUndefined(typed.toRepresentation({ o: 1, t: 2, th: 3 }))
    /** @type {any} */
    let map = { o: fauxCid }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: fauxCid, t: fauxCid, th: fauxCid }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('{String:nullable Int}', async () => {
    const typed = await buildAndVerify({
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

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:Int}'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '{String:Int}'`)
    }
    assert.isUndefined(typed.toTyped({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toTyped({ o: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toTyped({ o: 'one' }))
    assert.isUndefined(typed.toTyped({ o: 'one', t: 'two', th: 'three' }))
    assert.isUndefined(typed.toRepresentation({ num: 1, str: 'obj' }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: fauxCid, t: fauxCid, th: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ o: 'one' }))
    assert.isUndefined(typed.toRepresentation({ o: 'one', t: 'two', th: 'three' }))
    /** @type {any} */
    let map = { o: 1 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: 1, t: 2, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: null }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = { o: 1, t: null, th: 3 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {}
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('map listpairs', async () => {
    /*
      type MapAsListpairs {String:String} representation listpairs
    */
    const typed = await buildAndVerify({
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

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), undefined]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} != '{String:String}'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != '[[],...]'`)
    }
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ a: 'a' }))
    assert.isUndefined(typed.toTyped([1, 'obj']))
    assert.isUndefined(typed.toTyped([fauxCid]))
    assert.isUndefined(typed.toTyped([fauxCid, fauxCid, fauxCid]))
    assert.isUndefined(typed.toTyped([1]))
    assert.isUndefined(typed.toTyped([1, 2, 3]))
    assert.isUndefined(typed.toTyped(['one']))
    assert.isUndefined(typed.toTyped(['one', 'two', 'three']))
    assert.deepEqual(typed.toTyped([['o', 'one']]), { o: 'one' })
    assert.deepEqual(typed.toRepresentation({ o: 'one' }), [['o', 'one']])
    assert.isUndefined(typed.toTyped([[1, 'one']]))
    assert.deepEqual(typed.toTyped([['o', 'one'], ['t', 'two'], ['th', 'three']]), { o: 'one', t: 'two', th: 'three' })
    assert.deepEqual(typed.toRepresentation({ o: 'one', t: 'two', th: 'three' }), [['o', 'one'], ['t', 'two'], ['th', 'three']])
    assert.isUndefined(typed.toTyped([['o', 'one'], ['t', 'two'], ['th', fauxCid]]))
    assert.isUndefined(typed.toTyped([['o', 1], ['t', 2], ['th', 3]]))
    assert.deepEqual(typed.toTyped([]), {})
    assert.deepEqual(typed.toRepresentation({}), [])
    // not nullable
    assert.strictEqual(typed.toTyped({ o: null }), undefined)
    assert.strictEqual(typed.toRepresentation([['o', null]]), undefined)
  })

  it('map listpairs with nullable', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'Int',
            valueNullable: true,
            representation: { listpairs: {} }
          }
        }
      }
    }, '$map')

    /** @type {any} */
    let map = { o: 1 }
    assert.deepStrictEqual(typed.toTyped([['o', 1]]), map)
    assert.deepStrictEqual(typed.toRepresentation(map), [['o', 1]])
    map = { o: 1, t: 2, th: 3 }
    assert.deepStrictEqual(typed.toTyped([['o', 1], ['t', 2], ['th', 3]]), map)
    assert.deepStrictEqual(typed.toRepresentation(map), [['o', 1], ['t', 2], ['th', 3]])
    map = { o: null }
    assert.deepStrictEqual(typed.toTyped([['o', null]]), map)
    assert.deepStrictEqual(typed.toRepresentation(map), [['o', null]])
    map = { o: 1, t: null, th: 3 }
    assert.deepStrictEqual(typed.toTyped([['o', 1], ['t', null], ['th', 3]]), map)
    assert.deepStrictEqual(typed.toRepresentation(map), [['o', 1], ['t', null], ['th', 3]])
    map = {}
    assert.deepStrictEqual(typed.toTyped([]), map)
    assert.deepStrictEqual(typed.toRepresentation(map), [])
  })
})
