/* eslint-env mocha */

import { create } from '@ipld/schema/typed.js'
import chai from 'chai'
import { lint } from './lint.js'

const { assert } = chai

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Enums', () => {
  it('string', async () => {
    const typed = create({
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

    await lint(typed.toTyped)

    assert.strictEqual(typed.toTyped('Foo'), 'Foo')
    assert.strictEqual(typed.toTyped('Bar'), 'Bar')
    assert.strictEqual(typed.toTyped('Baz'), 'Baz')
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toTyped(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })

  it('string renames', async () => {
    const typed = create({
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

    await lint(typed.toTyped)

    assert.strictEqual(typed.toTyped('f'), 'Foo')
    assert.isUndefined(typed.toTyped('Foo'))
    assert.strictEqual(typed.toTyped('Bar'), 'Bar')
    assert.strictEqual(typed.toTyped('b'), 'Baz')
    assert.isUndefined(typed.toTyped('Baz'))
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toTyped(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })

  it('int', async () => {
    const typed = create({
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

    await lint(typed.toTyped)

    assert.strictEqual(typed.toTyped(0), 'Foo')
    assert.strictEqual(typed.toTyped(1), 'Bar')
    assert.strictEqual(typed.toTyped(100), 'Baz')
    assert.isUndefined(typed.toTyped(-1))
    assert.isUndefined(typed.toTyped(-100))
    assert.isUndefined(typed.toTyped(10))
    assert.isUndefined(typed.toTyped('Foo'))
    assert.isUndefined(typed.toTyped('Bar'))
    assert.isUndefined(typed.toTyped('Baz'))
    assert.isUndefined(typed.toTyped('Blip'))
    assert.isUndefined(typed.toTyped(''))
    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, fauxCid, new Uint8Array(0), Uint8Array.from([1, 2, 3]), {}, { a: 1 }, { a: 'str', b: 2 }, { a: 'str' }, [], [1], ['str', 2], ['str']]) {
      assert.isUndefined(typed.toTyped(obj), `obj: ${obj} == 'SimpleEnum'`)
    }
  })
})
