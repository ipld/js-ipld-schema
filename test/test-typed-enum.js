/* eslint-env mocha */

import { assert } from 'chai'
import { buildAndVerify } from './typed-util.js'

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Enums', () => {
  it('string', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleEnum: {
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: { string: {} }
          }
        }
      }
    }, 'SimpleEnum')

    assert.strictEqual(typed.toTyped('Foo'), 'Foo')
    assert.strictEqual(typed.toTyped('Bar'), 'Bar')
    assert.strictEqual(typed.toTyped('Baz'), 'Baz')
    assert.strictEqual(typed.toRepresentation('Foo'), 'Foo')
    assert.strictEqual(typed.toRepresentation('Bar'), 'Bar')
    assert.strictEqual(typed.toRepresentation('Baz'), 'Baz')
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toTyped(''))
    assert.isUndefined(typed.toRepresentation('Blip'))
    assert.isUndefined(typed.toRepresentation(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })

  it('string renames', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleEnumWithValues: {
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              string: {
                Foo: 'f',
                Baz: 'b'
              }
            }
          }
        }
      }
    }, 'SimpleEnumWithValues')

    assert.strictEqual(typed.toTyped('f'), 'Foo')
    assert.strictEqual(typed.toRepresentation('Foo'), 'f')
    assert.isUndefined(typed.toTyped('Foo'))
    assert.isUndefined(typed.toRepresentation('f'))
    assert.strictEqual(typed.toTyped('Bar'), 'Bar')
    assert.strictEqual(typed.toTyped('b'), 'Baz')
    assert.strictEqual(typed.toRepresentation('Bar'), 'Bar')
    assert.strictEqual(typed.toRepresentation('Baz'), 'b')
    assert.isUndefined(typed.toTyped('Baz'))
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toTyped(''))
    assert.isUndefined(typed.toRepresentation('b'))
    assert.isUndefined(typed.toRepresentation('Blip'))
    assert.isUndefined(typed.toRepresentation(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })

  it('int', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleEnum: {
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              int: {
                Foo: 0,
                Bar: 1,
                Baz: 100
              }
            }
          }
        }
      }
    }, 'SimpleEnum')

    assert.strictEqual(typed.toTyped(0), 'Foo')
    assert.strictEqual(typed.toTyped(1), 'Bar')
    assert.strictEqual(typed.toTyped(100), 'Baz')
    assert.strictEqual(typed.toRepresentation('Foo'), 0)
    assert.strictEqual(typed.toRepresentation('Bar'), 1)
    assert.strictEqual(typed.toRepresentation('Baz'), 100)
    assert.isUndefined(typed.toTyped(-1))
    assert.isUndefined(typed.toTyped(-100))
    assert.isUndefined(typed.toTyped(10))
    assert.isUndefined(typed.toTyped('Foo'))
    assert.isUndefined(typed.toTyped('Bar'))
    assert.isUndefined(typed.toTyped('Baz'))
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toRepresentation(''))
    assert.isUndefined(typed.toRepresentation(-1))
    assert.isUndefined(typed.toRepresentation(-100))
    assert.isUndefined(typed.toRepresentation(10))
    assert.isUndefined(typed.toRepresentation(0))
    assert.isUndefined(typed.toRepresentation(1))
    assert.isUndefined(typed.toRepresentation(100))
    assert.isUndefined(typed.toRepresentation('Blip'))
    assert.isUndefined(typed.toRepresentation(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
      assert.isUndefined(typed.toRepresentation(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })
})
