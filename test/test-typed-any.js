/* eslint-env mocha */

import { create } from '@ipld/schema/typed.js'
import chai from 'chai'
import { lint } from './lint.js'

const { assert } = chai

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Any', () => {
  it('AnyScalar', async function () {
    this.timeout(5000) // first test with linting which can be expensive to warm up in CI

    const typed = create({ types: {} }, 'AnyScalar')

    await lint(typed.toTyped)

    assert.deepStrictEqual(typed.toTyped(1.01), { Float: 1.01 })
    assert.deepStrictEqual(typed.toTyped(-0.1), { Float: -0.1 })
    assert.deepStrictEqual(typed.toTyped(101), { Int: 101 })
    assert.deepStrictEqual(typed.toTyped(-101), { Int: -101 })
    assert.deepStrictEqual(typed.toTyped('a string'), { String: 'a string' })
    assert.deepStrictEqual(typed.toTyped(false), { Bool: false })
    assert.deepStrictEqual(typed.toTyped(true), { Bool: true })
    assert.deepStrictEqual(typed.toTyped(new Uint8Array(0)), { Bytes: new Uint8Array(0) })
    assert.deepStrictEqual(typed.toTyped(new Uint8Array([1, 2, 3])), { Bytes: new Uint8Array([1, 2, 3]) })

    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped({ a: 'str' }))
    assert.isUndefined(typed.toTyped(['str']))
  })

  it('{String:AnyScalar}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'AnyScalar'
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const tc of /** @type {([string,any])[]} */([['Float', 1.01], ['Float', -0.1], ['Int', 101], ['Int', -101], ['String', 'a string'], ['Bool', false], ['Bool', true], ['Bytes', new Uint8Array(0)], ['Bytes', Uint8Array.from([1, 2, 3])]])) {
      /** @type {any} */
      let map = { a: tc[1] }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] } }, `{a:obj}: ${tc[1]} == 'AnyScalar'`)
      map = { a: tc[1], b: tc[1] }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] }, b: { [tc[0]]: tc[1] } }, `{a:obj, b:obj}: ${tc[1]} == 'AnyScalar'`)
      map = { a: tc[1], b: 100 }
      assert.deepStrictEqual(typed.toTyped(map), { a: { [tc[0]]: tc[1] }, b: { Int: 100 } }, `{a:obj, b:100}: ${tc[1]} == 'AnyScalar'`)
    }

    const map = {} // empty map should be fine
    assert.strictEqual(typed.toTyped(map), map)
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped(['str']))
    assert.isUndefined(typed.toTyped({ a: {} }))
    assert.isUndefined(typed.toTyped({ a: [] }))
  })

  it('[AnyScalar]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: 'AnyScalar'
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const tc of /** @type {([string,any])[]} */([['Float', 1.01], ['Float', -0.1], ['Int', 101], ['Int', -101], ['String', 'a string'], ['Bool', false], ['Bool', true], ['Bytes', new Uint8Array(0)], ['Bytes', Uint8Array.from([1, 2, 3])]])) {
      assert.deepStrictEqual(typed.toTyped([tc[1]]), [{ [tc[0]]: tc[1] }], `[obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toTyped([tc[1], tc[1]]), [{ [tc[0]]: tc[1] }, { [tc[0]]: tc[1] }], `[obj,obj]: ${tc[1]} == 'AnyScalar'`)
      assert.deepStrictEqual(typed.toTyped([tc[1], 100]), [{ [tc[0]]: tc[1] }, { Int: 100 }], `[obj,100]: ${tc[1]} == 'AnyScalar'`)
    }

    const list = /** @type {any} */ ([]) // empty list should be fine
    assert.strictEqual(typed.toTyped(list), list)
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ a: 'str' }))
    assert.isUndefined(typed.toTyped([{}]))
    assert.isUndefined(typed.toTyped([[]]))
  })

  it('any', async () => {
    const typed = create({ types: {} }, 'any')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped(obj), obj, `obj: ${obj} == 'any'`)
    }

    const map = { a: { b: [1] } }
    assert.deepStrictEqual(typed.toTyped(map), map)
    const list = [[[[[{}]]]]]
    assert.deepStrictEqual(typed.toTyped(list), list)
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
  })

  it('{String:any}', async () => {
    const typed = create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: 'any'
          }
        }
      }
    }, '$map')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped({ a: obj }), { a: obj })
    }

    assert.isUndefined(typed.toTyped([[[[[{}]]]]]))
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
  })

  it('[any]', async () => {
    const typed = create({
      types: {
        $list: {
          list: {
            valueType: 'any'
          }
        }
      }
    }, '$list')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.deepStrictEqual(typed.toTyped([obj]), [obj])
      assert.deepStrictEqual(typed.toTyped([obj, obj, obj]), [obj, obj, obj])
    }

    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped(undefined))
    assert.isUndefined(typed.toTyped([undefined, undefined]))
    assert.isUndefined(typed.toTyped({ a: undefined }))
  })
})
