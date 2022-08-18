/* eslint-env mocha */

import { create } from '@ipld/schema/typed.js'
import chai from 'chai'
import { lint } from './lint.js'

const { assert } = chai

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Unions', () => {
  it('keyed', async () => {
    const typed = create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionKeyed: {
          union: {
            members: [
              'Bar',
              'Foo',
              'Baz'
            ],
            representation: {
              keyed: {
                bar: 'Bar',
                foo: 'Foo',
                baz: 'Baz'
              }
            }
          }
        }
      }
    }, 'UnionKeyed')

    await lint(typed.toTyped)

    assert.deepStrictEqual(typed.toTyped({ foo: 100 }), { Foo: 100 })
    assert.deepStrictEqual(typed.toTyped({ bar: true }), { Bar: true })
    assert.deepStrictEqual(typed.toTyped({ baz: 'yep' }), { Baz: 'yep' })
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ foo: 'not an int' }))
    assert.isUndefined(typed.toTyped({ bar: 'not a bool' }))
    assert.isUndefined(typed.toTyped({ baz: true }))
  })

  it('kinded', async () => {
    const typed = create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionKinded: {
          union: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              kinded: {
                int: 'Foo',
                bool: 'Bar',
                string: 'Baz'
              }
            }
          }
        }
      }
    }, 'UnionKinded')

    await lint(typed.toTyped)

    assert.deepStrictEqual(typed.toTyped(100), { Foo: 100 })
    assert.deepStrictEqual(typed.toTyped(-100), { Foo: -100 })
    assert.deepStrictEqual(typed.toTyped(true), { Bar: true })
    assert.deepStrictEqual(typed.toTyped(false), { Bar: false })
    assert.deepStrictEqual(typed.toTyped('yep'), { Baz: 'yep' })
    assert.deepStrictEqual(typed.toTyped(''), { Baz: '' })
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped({ foo: 100 }))
    assert.isUndefined(typed.toTyped({ bar: true }))
    assert.isUndefined(typed.toTyped({ baz: 'yep' }))
  })

  it('kinded complex', async () => {
    /**
     * @param {{expectedType?: string}} link
     */
    const typed = create({
      types: {
        mylist: {
          list: {
            valueType: 'String'
          }
        },
        mymap: {
          map: {
            keyType: 'String',
            valueType: 'Int'
          }
        },
        Foo: { int: {} },
        UnionKinded: {
          union: {
            members: [
              'mylist',
              'mymap',
              'Foo'
            ],
            representation: {
              kinded: {
                list: 'mylist',
                map: 'mymap',
                int: 'Foo'
              }
            }
          }
        }
      }
    }, 'UnionKinded')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 'a string', false, true, new Uint8Array(0), Uint8Array.from([1, 2, 3]), undefined]) {
      assert.isUndefined(typed.toTyped(obj))
    }

    assert.deepStrictEqual(typed.toTyped([]), { mylist: [] })
    assert.deepStrictEqual(typed.toTyped(['', 'a']), { mylist: ['', 'a'] })
    assert.isUndefined(typed.toTyped(['', 1]))
    assert.isUndefined(typed.toTyped([1, 2]))
    assert.deepStrictEqual(typed.toTyped({}), { mymap: {} })
    assert.deepStrictEqual(typed.toTyped({ a: 1, b: 2 }), { mymap: { a: 1, b: 2 } })
    assert.isUndefined(typed.toTyped({ a: 'a', b: 2 }))
  })

  it('inline', async () => {
    /*
      type Bar struct {
        bral String
        blop Int
      }
      type Foo struct {
        froz Bool
      }
      type UnionInline union {
        | Foo "foo"
        | Bar "bar"
      } representation inline {
        discriminantKey "tag"
      }
    */
    const typed = create({
      types: {
        UnionInline: {
          union: {
            members: [
              'Foo',
              'Bar'
            ],
            representation: {
              inline: {
                discriminantKey: 'tag',
                discriminantTable: {
                  foo: 'Foo',
                  bar: 'Bar'
                }
              }
            }
          }
        },
        Foo: {
          struct: {
            fields: {
              froz: { type: 'Bool' }
            },
            representation: { map: {} }
          }
        },
        Bar: {
          struct: {
            fields: {
              bral: { type: 'String' },
              blop: { type: 'Int' }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'UnionInline')

    await lint(typed.toTyped)

    assert.deepStrictEqual(typed.toTyped({ tag: 'foo', froz: true }), { Foo: { froz: true } })
    assert.deepStrictEqual(typed.toTyped({ tag: 'bar', bral: 'zot', blop: 100 }), { Bar: { bral: 'zot', blop: 100 } })

    assert.isUndefined(typed.toTyped({ froz: true }))
    assert.isUndefined(typed.toTyped({ bral: 'zot' }))
    assert.isUndefined(typed.toTyped({ tag: 'foo' }))
    assert.isUndefined(typed.toTyped({ tag: 'bar' }))
    assert.isUndefined(typed.toTyped({ tag: 'foo', bral: 'zot' }))
    assert.isUndefined(typed.toTyped({ tag: 'bar', froz: true }))
    assert.isUndefined(typed.toTyped({ tag: 'foo', froz: 'zot' }))
  })

  it('envelope', async () => {
    /*
      type Bar bool
      type Baz string
      type Foo int
      type UnionEnvelope union {
        | Foo "foo"
        | Bar "bar"
        | Baz "baz"
      } representation envelope {
        discriminantKey "bim"
        contentKey "bam"
      }
    */
    const typed = create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: {
          list: {
            valueType: 'Int'
          }
        },
        UnionEnvelope: {
          union: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              envelope: {
                discriminantKey: 'bim',
                contentKey: 'bam',
                discriminantTable: {
                  foo: 'Foo',
                  bar: 'Bar',
                  baz: 'Baz'
                }
              }
            }
          }
        }
      }
    }, 'UnionEnvelope')

    await lint(typed.toTyped)

    assert.deepStrictEqual(typed.toTyped({ bim: 'foo', bam: [100, 200, 300] }), { Foo: [100, 200, 300] })
    assert.deepStrictEqual(typed.toTyped({ bim: 'bar', bam: true }), { Bar: true })
    assert.deepStrictEqual(typed.toTyped({ bim: 'baz', bam: 'here be baz' }), { Baz: 'here be baz' })

    assert.isUndefined(typed.toTyped({ bim: 'foo' }))
    assert.isUndefined(typed.toTyped({ bim: 'bar' }))
    assert.isUndefined(typed.toTyped({ bim: 'baz' }))
    assert.isUndefined(typed.toTyped({ bim: 'foo', bam: 'zot' }))
    assert.isUndefined(typed.toTyped({ bim: 'foo', bam: ['zot'] }))
    assert.isUndefined(typed.toTyped({ bim: 'bar', bam: 100 }))
    assert.isUndefined(typed.toTyped({ bim: 'baz', bam: true }))
    assert.isUndefined(typed.toTyped(100))
    assert.isUndefined(typed.toTyped(true))
    assert.isUndefined(typed.toTyped('here be string'))
    assert.isUndefined(typed.toTyped({ }))
    assert.isUndefined(typed.toTyped([]))
  })

  it('bytesprefix', async () => {
    /*
      type Bls12_381Signature bytes
      type Secp256k1Signature bytes
      type Signature union {
        | Secp256k1Signature 0
        | Bls12_381Signature 1
      } representation bytesprefix
    */
    const typed = create({
      types: {
        Bls12_381Signature: { bytes: {} },
        Secp256k1Signature: { bytes: {} },
        Signature: {
          union: {
            members: [
              'Secp256k1Signature',
              'Bls12_381Signature'
            ],
            representation: {
              bytesprefix: {
                '00': 'Secp256k1Signature',
                '01': 'Bls12_381Signature'
              }
            }
          }
        }
      }
    }, 'Signature')

    await lint(typed.toTyped)

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, {}, [], undefined]) {
      assert.isUndefined(typed.toTyped(obj))
    }

    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([0, 1, 2, 3])), { Secp256k1Signature: Uint8Array.from([1, 2, 3]) })
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([0])), { Secp256k1Signature: Uint8Array.from([]) })
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([1, 1, 2, 3])), { Bls12_381Signature: Uint8Array.from([1, 2, 3]) })
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([1])), { Bls12_381Signature: Uint8Array.from([]) })
    assert.isUndefined(typed.toTyped(Uint8Array.from([2, 1, 2, 3])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([2])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([0xff, 1, 2, 3])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([0xff])))
  })
})
