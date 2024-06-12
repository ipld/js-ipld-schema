/* eslint-env mocha */

import { assert } from 'chai'
import { buildAndVerify } from './typed-util.js'

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Unions', () => {
  it('keyed', async () => {
    const typed = await buildAndVerify({
      types: {
        Bar: { bool: {} },
        'Baz!': { string: {} },
        Foo: { int: {} },
        UnionKeyed: {
          union: {
            members: [
              'Bar',
              'Foo',
              'Baz!'
            ],
            representation: {
              keyed: {
                bar: 'Bar',
                foo: 'Foo',
                baz: 'Baz!'
              }
            }
          }
        }
      }
    }, 'UnionKeyed')

    assert.deepStrictEqual(typed.toTyped({ foo: 100 }), { Foo: 100 })
    assert.deepStrictEqual(typed.toRepresentation({ Foo: 100 }), { foo: 100 })
    assert.deepStrictEqual(typed.toTyped({ bar: true }), { Bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ Bar: true }), { bar: true })
    assert.deepStrictEqual(typed.toTyped({ baz: 'yep' }), { 'Baz!': 'yep' })
    assert.deepStrictEqual(typed.toRepresentation({ 'Baz!': 'yep' }), { baz: 'yep' })
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ foo: 'not an int' }))
    assert.isUndefined(typed.toTyped({ bar: 'not a bool' }))
    assert.isUndefined(typed.toTyped({ baz: true }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation({ Foo: 'not an int' }))
    assert.isUndefined(typed.toRepresentation({ Bar: 'not a bool' }))
    assert.isUndefined(typed.toRepresentation({ 'Baz!': true }))
  })

  it('kinded', async () => {
    const typed = await buildAndVerify({
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

    assert.deepStrictEqual(typed.toTyped(100), { Foo: 100 })
    assert.deepStrictEqual(typed.toRepresentation({ Foo: 100 }), 100)
    assert.deepStrictEqual(typed.toTyped(-100), { Foo: -100 })
    assert.deepStrictEqual(typed.toRepresentation({ Foo: -100 }), -100)
    assert.deepStrictEqual(typed.toTyped(true), { Bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ Bar: true }), true)
    assert.deepStrictEqual(typed.toTyped(false), { Bar: false })
    assert.deepStrictEqual(typed.toRepresentation({ Bar: false }), false)
    assert.deepStrictEqual(typed.toTyped('yep'), { Baz: 'yep' })
    assert.deepStrictEqual(typed.toRepresentation({ Baz: 'yep' }), 'yep')
    assert.deepStrictEqual(typed.toTyped(''), { Baz: '' })
    assert.deepStrictEqual(typed.toRepresentation({ Baz: '' }), '')
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped(null))
    assert.isUndefined(typed.toTyped(1.101))
    assert.isUndefined(typed.toTyped(new Uint8Array(0)))
    assert.isUndefined(typed.toTyped({ foo: 100 }))
    assert.isUndefined(typed.toTyped({ bar: true }))
    assert.isUndefined(typed.toTyped({ baz: 'yep' }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation([]))
    assert.isUndefined(typed.toRepresentation(null))
    assert.isUndefined(typed.toRepresentation(1.101))
    assert.isUndefined(typed.toRepresentation(new Uint8Array(0)))
  })

  it('kinded complex', async () => {
    /**
     * @param {{expectedType?: string}} link
     */
    const typed = await buildAndVerify({
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

    for (const obj of [null, 1.01, -0.1, 'a string', false, true, new Uint8Array(0), Uint8Array.from([1, 2, 3]), undefined]) {
      assert.isUndefined(typed.toTyped(obj))
      assert.isUndefined(typed.toRepresentation(obj))
    }

    assert.deepStrictEqual(typed.toTyped([]), { mylist: [] })
    assert.deepStrictEqual(typed.toRepresentation({ mylist: [] }), [])
    assert.deepStrictEqual(typed.toTyped(['', 'a']), { mylist: ['', 'a'] })
    assert.deepStrictEqual(typed.toRepresentation({ mylist: ['', 'a'] }), ['', 'a'])
    assert.isUndefined(typed.toTyped(['', 1]))
    assert.isUndefined(typed.toTyped([1, 2]))
    assert.isUndefined(typed.toRepresentation({ mylist: ['', 1] }))
    assert.isUndefined(typed.toRepresentation({ mylist: [1, 2] }))
    assert.deepStrictEqual(typed.toTyped({}), { mymap: {} })
    assert.deepStrictEqual(typed.toRepresentation({ mymap: {} }), {})
    assert.deepStrictEqual(typed.toTyped({ a: 1, b: 2 }), { mymap: { a: 1, b: 2 } })
    assert.deepStrictEqual(typed.toRepresentation({ mymap: { a: 1, b: 2 } }), { a: 1, b: 2 })
    assert.isUndefined(typed.toTyped({ a: 'a', b: 2 }))
    assert.isUndefined(typed.toRepresentation({ mymap: { a: 'a', b: 2 } }))
    assert.isUndefined(typed.toRepresentation({ mymap: { a: 'a', b: 2 } }))
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
    const typed = await buildAndVerify({
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

    assert.deepStrictEqual(typed.toTyped({ tag: 'foo', froz: true }), { Foo: { froz: true } })
    assert.deepStrictEqual(typed.toRepresentation({ Foo: { froz: true } }), { tag: 'foo', froz: true })
    assert.deepStrictEqual(typed.toTyped({ tag: 'bar', bral: 'zot', blop: 100 }), { Bar: { bral: 'zot', blop: 100 } })
    assert.deepStrictEqual(typed.toRepresentation({ Bar: { bral: 'zot', blop: 100 } }), { tag: 'bar', bral: 'zot', blop: 100 })

    assert.isUndefined(typed.toTyped({ froz: true }))
    assert.isUndefined(typed.toTyped({ bral: 'zot' }))
    assert.isUndefined(typed.toTyped({ tag: 'foo' }))
    assert.isUndefined(typed.toTyped({ tag: 'bar' }))
    assert.isUndefined(typed.toTyped({ tag: 'foo', bral: 'zot' }))
    assert.isUndefined(typed.toTyped({ tag: 'bar', froz: true }))
    assert.isUndefined(typed.toTyped({ tag: 'foo', froz: 'zot' }))
    assert.isUndefined(typed.toRepresentation({ froz: true }))
    assert.isUndefined(typed.toRepresentation({ bral: 'zot' }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation({ bral: 'zot' }))
    assert.isUndefined(typed.toRepresentation({ froz: true }))
    assert.isUndefined(typed.toRepresentation({ froz: 'zot' }))
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
    const typed = await buildAndVerify({
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

    assert.deepStrictEqual(typed.toTyped({ bim: 'foo', bam: [100, 200, 300] }), { Foo: [100, 200, 300] })
    assert.deepStrictEqual(typed.toRepresentation({ Foo: [100, 200, 300] }), { bim: 'foo', bam: [100, 200, 300] })
    assert.deepStrictEqual(typed.toTyped({ bim: 'bar', bam: true }), { Bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ Bar: true }), { bim: 'bar', bam: true })
    assert.deepStrictEqual(typed.toTyped({ bim: 'baz', bam: 'here be baz' }), { Baz: 'here be baz' })
    assert.deepStrictEqual(typed.toRepresentation({ Baz: 'here be baz' }), { bim: 'baz', bam: 'here be baz' })

    assert.isUndefined(typed.toTyped({ bim: 'foo' }))
    assert.isUndefined(typed.toTyped({ bim: 'bar' }))
    assert.isUndefined(typed.toTyped({ bim: 'baz' }))
    assert.isUndefined(typed.toTyped({ bim: 'foo', bam: 'zot' }))
    assert.isUndefined(typed.toRepresentation({ Foo: 'zot' }))
    assert.isUndefined(typed.toTyped({ bim: 'foo', bam: ['zot'] }))
    assert.isUndefined(typed.toRepresentation({ Foo: ['zot'] }))
    assert.isUndefined(typed.toTyped({ bim: 'bar', bam: 100 }))
    assert.isUndefined(typed.toRepresentation({ Bar: 100 }))
    assert.isUndefined(typed.toTyped({ bim: 'baz', bam: true }))
    assert.isUndefined(typed.toRepresentation({ Baz: true }))
    assert.isUndefined(typed.toTyped(100))
    assert.isUndefined(typed.toTyped(true))
    assert.isUndefined(typed.toTyped('here be string'))
    assert.isUndefined(typed.toTyped({ }))
    assert.isUndefined(typed.toRepresentation({ }))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toRepresentation([]))
  })

  it('bytesprefix', async () => {
    /*
      type Bls12_381Signature bytes
      type Secp256k1Signature bytes
      type Signature union {
        | Secp256k1Signature "00"
        | Bls12_381Signature "01"
      } representation bytesprefix
    */
    const typed = await buildAndVerify({
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
                prefixes: {
                  '00': 'Secp256k1Signature',
                  '01': 'Bls12_381Signature'
                }
              }
            }
          }
        }
      }
    }, 'Signature')

    for (const obj of [null, 1.01, -0.1, 101, -101, 'a string', false, true, {}, [], undefined]) {
      assert.isUndefined(typed.toTyped(obj))
      assert.isUndefined(typed.toRepresentation(obj))
    }

    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([0, 1, 2, 3])), { Secp256k1Signature: Uint8Array.from([1, 2, 3]) })
    assert.deepStrictEqual(typed.toRepresentation({ Secp256k1Signature: Uint8Array.from([1, 2, 3]) }), Uint8Array.from([0, 1, 2, 3]))
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([0])), { Secp256k1Signature: Uint8Array.from([]) })
    assert.deepStrictEqual(typed.toRepresentation({ Secp256k1Signature: Uint8Array.from([]) }), Uint8Array.from([0]))
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([1, 1, 2, 3])), { Bls12_381Signature: Uint8Array.from([1, 2, 3]) })
    assert.deepStrictEqual(typed.toRepresentation({ Bls12_381Signature: Uint8Array.from([1, 2, 3]) }), Uint8Array.from([1, 1, 2, 3]))
    assert.deepStrictEqual(typed.toTyped(Uint8Array.from([1])), { Bls12_381Signature: Uint8Array.from([]) })
    assert.deepStrictEqual(typed.toRepresentation({ Bls12_381Signature: Uint8Array.from([]) }), Uint8Array.from([1]))
    assert.isUndefined(typed.toTyped(Uint8Array.from([2, 1, 2, 3])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([2])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([0xff, 1, 2, 3])))
    assert.isUndefined(typed.toTyped(Uint8Array.from([0xff])))
    assert.isUndefined(typed.toRepresentation({ Baz: true }))
    assert.isUndefined(typed.toRepresentation({}))
  })
})
