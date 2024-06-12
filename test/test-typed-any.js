/* eslint-env mocha */

import { assert } from 'chai'
import { buildAndVerify } from './typed-util.js'

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Any', () => {
  it('AnyScalar', async function () {
    this.timeout(5000) // first test with linting which can be expensive to warm up in CI

    const typed = await buildAndVerify({ types: {} }, 'AnyScalar')

    assert.deepStrictEqual(typed.toTyped(1.01), { Float: 1.01 })
    assert.deepStrictEqual(typed.toTyped(-0.1), { Float: -0.1 })
    assert.deepStrictEqual(typed.toTyped(101), { Int: 101 })
    assert.deepStrictEqual(typed.toTyped(-101), { Int: -101 })
    assert.deepStrictEqual(typed.toTyped('a string'), { String: 'a string' })
    assert.deepStrictEqual(typed.toTyped(false), { Bool: false })
    assert.deepStrictEqual(typed.toTyped(true), { Bool: true })
    assert.deepStrictEqual(typed.toTyped(new Uint8Array(0)), { Bytes: new Uint8Array(0) })
    assert.deepStrictEqual(typed.toTyped(new Uint8Array([1, 2, 3])), { Bytes: new Uint8Array([1, 2, 3]) })

    assert.deepStrictEqual(typed.toRepresentation({ Float: 1.01 }), 1.01)
    assert.deepStrictEqual(typed.toRepresentation({ Float: -0.1 }), -0.1)
    assert.deepStrictEqual(typed.toRepresentation({ Int: 101 }), 101)
    assert.deepStrictEqual(typed.toRepresentation({ Int: -101 }), -101)
    assert.deepStrictEqual(typed.toRepresentation({ String: 'a string' }), 'a string')
    assert.deepStrictEqual(typed.toRepresentation({ Bool: false }), false)
    assert.deepStrictEqual(typed.toRepresentation({ Bool: true }), true)
    assert.deepStrictEqual(typed.toRepresentation({ Bytes: new Uint8Array(0) }), new Uint8Array(0))
    assert.deepStrictEqual(typed.toRepresentation({ Bytes: new Uint8Array([1, 2, 3]) }), new Uint8Array([1, 2, 3]))

    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped({ a: 'str' }))
    assert.isUndefined(typed.toTyped(['str']))

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], {}, { foo: 1 }, { Int: 1, foo: 2 }, undefined]) {
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != AnyScalar repr`)
    }
  })

  it('{String:AnyScalar}', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'AnyScalar'
          }
        }
      }
    }, '$map')

    for (const tc of /** @type {([string,any])[]} */([['Float', 1.01], ['Float', -0.1], ['Int', 101], ['Int', -101], ['String', 'a string'], ['Bool', false], ['Bool', true], ['Bytes', new Uint8Array(0)], ['Bytes', Uint8Array.from([1, 2, 3])]])) {
      /** @type {any} */
      let map = { a: tc[1] }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] } }, `{a:obj}: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation({ a: { [tc[0]]: tc[1] } }), map, `{a:obj}: ${tc[1]} == 'AnyScalar'`)
      map = { a: tc[1], b: tc[1] }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] }, b: { [tc[0]]: tc[1] } }, `{a:obj, b:obj}: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation({ a: { [tc[0]]: tc[1] }, b: { [tc[0]]: tc[1] } }), map, `{a:obj, b:obj}: ${tc[1]} == 'AnyScalar'`)
      map = { a: tc[1], b: 100 }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] }, b: { Int: 100 } }, `{a:obj, b:100}: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation({ a: { [tc[0]]: tc[1] }, b: { Int: 100 } }), map, `{a:obj, b:100}: ${tc[1]} == 'AnyScalar'`)
    }

    const map = {} // empty map should be fine
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped(['str']))
    assert.isUndefined(typed.toTyped({ a: {} }))
    assert.isUndefined(typed.toTyped({ a: [] }))

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], { foo: 1 }, { Int: 1, foo: 2 }, undefined]) {
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != {String:AnyScalar} repr`)
      assert.isUndefined(typed.toRepresentation({ a: obj }), `{a:obj}: ${obj} != {String:AnyScalar} repr`)
    }
  })

  it('[AnyScalar]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: 'AnyScalar'
          }
        }
      }
    }, '$list')

    for (const tc of /** @type {([string,any])[]} */([['Float', 1.01], ['Float', -0.1], ['Int', 101], ['Int', -101], ['String', 'a string'], ['Bool', false], ['Bool', true], ['Bytes', new Uint8Array(0)], ['Bytes', Uint8Array.from([1, 2, 3])]])) {
      assert.deepStrictEqual(typed.toTyped([tc[1]]), [{ [tc[0]]: tc[1] }], `[obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation([{ [tc[0]]: tc[1] }]), [tc[1]], `[obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toTyped([tc[1], tc[1]]), [{ [tc[0]]: tc[1] }, { [tc[0]]: tc[1] }], `[obj,obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation([{ [tc[0]]: tc[1] }, { [tc[0]]: tc[1] }]), [tc[1], tc[1]], `[obj,obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toTyped([tc[1], 100]), [{ [tc[0]]: tc[1] }, { Int: 100 }], `[obj,100]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toRepresentation([{ [tc[0]]: tc[1] }, { Int: 100 }]), [tc[1], 100], `[obj,100]: ${tc[1]} == 'AnyScalar'`)
    }

    const list = /** @type {any} */ ([]) // empty list should be fine
    assert.strictEqual(typed.toTyped(list), list)
    assert.strictEqual(typed.toRepresentation(list), list)
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ a: 'str' }))
    assert.isUndefined(typed.toTyped([{}]))
    assert.isUndefined(typed.toTyped([[]]))

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), ['one', 'two', 'three'], [1, 'one', true], { foo: 1 }, { Int: 1, foo: 2 }, undefined]) {
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} != [AnyScalar] repr`)
      assert.isUndefined(typed.toRepresentation([obj]), `[obj]: ${obj} != [AnyScalar] repr`)
    }
  })

  it('any', async () => {
    const typed = await buildAndVerify({ types: {} }, 'any')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped(obj), obj, `obj: ${obj} == 'any'`)
    }

    const map = { a: { b: [1] } }
    assert.deepStrictEqual(typed.toTyped(map), map)
    assert.deepStrictEqual(typed.toRepresentation(map), map)
    const list = [[[[[{}]]]]]
    assert.deepStrictEqual(typed.toTyped(list), list)
    assert.deepStrictEqual(typed.toRepresentation(list), list)
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
    assert.isUndefined(typed.toRepresentation(undefined))
    assert.isUndefined(typed.toRepresentation([undefined, undefined]))
    assert.isUndefined(typed.toRepresentation({ a: undefined }))
  })

  it('{String:any}', async () => {
    const typed = await buildAndVerify({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'any'
          }
        }
      }
    }, '$map')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped({ a: obj }), { a: obj })
      assert.deepStrictEqual(typed.toRepresentation({ a: obj }), { a: obj })
    }

    assert.isUndefined(typed.toTyped([[[[[{}]]]]]))
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
    assert.isUndefined(typed.toRepresentation([[[[[{}]]]]]))
    assert.isUndefined(typed.toRepresentation(undefined))
    assert.isUndefined(typed.toRepresentation([undefined, undefined]))
    assert.isUndefined(typed.toRepresentation({ a: undefined }))
  })

  it('[any]', async () => {
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: 'any'
          }
        }
      }
    }, '$list')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped([obj]), [obj])
      assert.deepStrictEqual(typed.toRepresentation([obj]), [obj])
      assert.deepStrictEqual(typed.toTyped([obj, obj, obj]), [obj, obj, obj])
      assert.deepStrictEqual(typed.toRepresentation([obj, obj, obj]), [obj, obj, obj])
    }

    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation(undefined))
    assert.isUndefined(typed.toRepresentation([undefined, undefined]))
    assert.isUndefined(typed.toRepresentation({ a: undefined }))
  })
})
