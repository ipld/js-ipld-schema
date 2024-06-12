/* eslint-env mocha */

import { assert } from 'chai'
import { buildAndVerify } from './typed-util.js'

const fauxCid = {}
fauxCid.asCID = fauxCid

describe('Structs', () => {
  it('struct with 3 different field kinds', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'SimpleStruct')

    const map = { foo: 100, bar: true, baz: 'this is baz' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    assert.deepStrictEqual(map, { foo: 100, bar: true, baz: 'this is baz' })
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true }))
    assert.isUndefined(typed.toTyped({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true, baz: 'this is baz', nope: 1 }))
    assert.isUndefined(typed.toTyped([100, true, 'nope']))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true }))
    assert.isUndefined(typed.toRepresentation({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz', nope: 1 }))
    assert.isUndefined(typed.toRepresentation([100, true, 'nope']))
  })

  it('struct within a struct', async () => {
    const typed = await buildAndVerify({
      types: {
        $struct2: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { map: {} }
          }
        },
        $struct1: {
          struct: {
            fields: {
              one: { type: 'Int' },
              two: { type: '$struct2' },
              three: { type: 'Link' }
            },
            representation: { map: {} }
          }
        }
      }
    }, '$struct1')

    const map = { one: -1, two: { foo: 100, bar: true, baz: 'this is baz' }, three: fauxCid }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    // sanity check no mutation
    assert.deepStrictEqual(map, { one: -1, two: { foo: 100, bar: true, baz: 'this is baz' }, three: fauxCid })
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ one: -1, two: {}, three: fauxCid }))
    assert.isUndefined(typed.toTyped({ one: -1, two: [], three: fauxCid }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation({ one: -1, two: {}, three: fauxCid }))
    assert.isUndefined(typed.toRepresentation({ one: -1, two: [], three: fauxCid }))
  })

  it('struct with maps and lists and structs', async () => {
    /*
    type $list [&Any]

    type $map {String:$list}

    type $struct2 struct {
      foo Int
      bar Bool
      baz $list
    }

    type $struct1 struct {
      one $map
      two $struct2
      three &Any
    }
    */
    const typed = await buildAndVerify({
      types: {
        $list: {
          list: {
            valueType: { link: {} }
          }
        },
        $map: {
          map: {
            keyType: 'String',
            valueType: '$list'
          }
        },
        $struct2: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: '$list' }
            },
            representation: { map: {} }
          }
        },
        $struct1: {
          struct: {
            fields: {
              one: { type: '$map' },
              two: { type: '$struct2' },
              three: { type: 'Link' }
            },
            representation: { map: {} }
          }
        }
      }
    }, '$struct1')

    let map = {
      one: { o: [fauxCid], t: [], th: [fauxCid, fauxCid, fauxCid] },
      two: { foo: 100, bar: true, baz: [fauxCid, fauxCid, fauxCid] },
      three: fauxCid
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {
      // @ts-ignore
      one: {},
      // @ts-ignore
      two: { foo: 100, bar: true, baz: [] },
      // @ts-ignore
      three: fauxCid
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    map = {
      // @ts-ignore
      one: {},
      // @ts-ignore
      two: { foo: 100, bar: true, baz: [] },
      // @ts-ignore
      three: fauxCid,
      // @ts-ignore
      four: 'nope'
    }
    assert.isUndefined(typed.toTyped(map))
    assert.isUndefined(typed.toRepresentation(map))
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toRepresentation({}))
  })

  it('struct with tuple representation', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { tuple: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(typed.toTyped([100, true, 'this is baz']), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz' }), [100, true, 'this is baz'])
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation([100, true, 'this is baz']))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toTyped([100, true]))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true }))
    assert.isUndefined(typed.toTyped([100, 'this is baz']))
    assert.isUndefined(typed.toRepresentation({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped([true, 'this is baz']))
    assert.isUndefined(typed.toRepresentation({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped([100, true, 'this is baz', 1]))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz', bam: 1 }))
    assert.isUndefined(typed.toTyped([1, 100, true, 'nope']))
    assert.isUndefined(typed.toTyped([true, 100, 'nope']))
    assert.isUndefined(typed.toTyped([100, 'nope', true]))
  })

  it('struct with tuple representation containing structs', async () => {
    const typed = await buildAndVerify({
      types: {
        $struct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { map: {} }
          }
        },
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: '$struct' },
              bar: { type: '$struct' }
            },
            representation: { tuple: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(
      typed.toTyped([{ foo: 100, bar: true, baz: 'this is baz' }, { foo: -1100, bar: false, baz: '' }]),
      {
        foo: { foo: 100, bar: true, baz: 'this is baz' },
        bar: { foo: -1100, bar: false, baz: '' }
      }
    )
    assert.deepStrictEqual(
      typed.toRepresentation(
        {
          foo: { foo: 100, bar: true, baz: 'this is baz' },
          bar: { foo: -1100, bar: false, baz: '' }
        }
      ),
      [{ foo: 100, bar: true, baz: 'this is baz' }, { foo: -1100, bar: false, baz: '' }]
    )
    assert.isUndefined(typed.toTyped([{}, {}]))
    assert.isUndefined(typed.toRepresentation({ foo: {}, bar: {} }))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toRepresentation({}))
  })

  it('struct with listpairs representation', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { listpairs: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(typed.toTyped([['foo', 100], ['bar', true], ['baz', 'this is baz']]), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toTyped([['bar', true], ['foo', 100], ['baz', 'this is baz']]), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toTyped([['bar', true], ['baz', 'this is baz'], ['foo', 100]]), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toTyped([['baz', 'this is baz'], ['bar', true], ['foo', 100]]), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz' }), [['foo', 100], ['bar', true], ['baz', 'this is baz']])
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation([100, true, 'this is baz']))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toTyped([['foo', 100], ['bar', true]]))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true }))
    assert.isUndefined(typed.toTyped([['foo', 100], ['baz', 'this is baz']]))
    assert.isUndefined(typed.toRepresentation({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped([['bar', true], ['baz', 'this is baz']]))
    assert.isUndefined(typed.toRepresentation({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped([['foo', 100], ['bar', true], ['baz', 'this is baz'], ['bam', 1]]))
    assert.isUndefined(typed.toTyped([['foo', 100], ['bar', true], ['baz', 'this is baz'], 1]))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz', bam: 1 }))
    assert.isUndefined(typed.toTyped([1, 100, true, 'nope']))
  })

  it('struct with listpairs representation containing structs', async () => {
    const typed = await buildAndVerify({
      types: {
        $struct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: { map: {} }
          }
        },
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: '$struct' },
              bar: { type: '$struct' }
            },
            representation: { listpairs: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(
      typed.toTyped([['foo', { foo: 100, bar: true, baz: 'this is baz' }], ['bar', { foo: -1100, bar: false, baz: '' }]]),
      {
        foo: { foo: 100, bar: true, baz: 'this is baz' },
        bar: { foo: -1100, bar: false, baz: '' }
      }
    )
    assert.deepStrictEqual(
      typed.toTyped([['bar', { foo: -1100, bar: false, baz: '' }], ['foo', { foo: 100, bar: true, baz: 'this is baz' }]]),
      {
        foo: { foo: 100, bar: true, baz: 'this is baz' },
        bar: { foo: -1100, bar: false, baz: '' }
      }
    )
    assert.deepStrictEqual(
      typed.toRepresentation(
        {
          foo: { foo: 100, bar: true, baz: 'this is baz' },
          bar: { foo: -1100, bar: false, baz: '' }
        }
      ),
      [['foo', { foo: 100, bar: true, baz: 'this is baz' }], ['bar', { foo: -1100, bar: false, baz: '' }]]
    )
    assert.isUndefined(typed.toTyped([{}, {}]))
    assert.isUndefined(typed.toTyped([['foo', {}], ['bar', {}]]))
    assert.isUndefined(typed.toRepresentation({ foo: {}, bar: {} }))
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped([[], []]))
    assert.isUndefined(typed.toRepresentation({}))
  })

  it('struct nullables', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', nullable: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', nullable: true }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'SimpleStruct')

    let map = { foo: 100, bar: true, baz: 'this is baz' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    assert.deepStrictEqual(map, { foo: 100, bar: true, baz: 'this is baz' }) // sanity check no mutation
    assert.isUndefined(typed.toTyped({}))
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true }))
    assert.isUndefined(typed.toTyped({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true, baz: 'this is baz', nope: 1 }))
    assert.isUndefined(typed.toTyped({ foo: undefined, bar: true, baz: '' }))
    assert.isUndefined(typed.toTyped({ foo: 1, bar: true, baz: undefined }))
    assert.isUndefined(typed.toTyped({ foo: undefined, bar: true, baz: undefined }))
    assert.isUndefined(typed.toRepresentation({}))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true }))
    assert.isUndefined(typed.toRepresentation({ foo: 100, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation({ bar: true, baz: 'this is baz' }))
    assert.isUndefined(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz', nope: 1 }))
    assert.isUndefined(typed.toRepresentation({ foo: undefined, bar: true, baz: '' }))
    assert.isUndefined(typed.toRepresentation({ foo: 1, bar: true, baz: undefined }))
    assert.isUndefined(typed.toRepresentation({ foo: undefined, bar: true, baz: undefined }))
    // @ts-ignore
    map = { foo: null, bar: true, baz: '' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    // @ts-ignore
    map = { foo: 1, bar: true, baz: null }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    // @ts-ignore
    map = { foo: null, bar: true, baz: null }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('struct tuple nullables', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', nullable: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', nullable: true }
            },
            representation: { tuple: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(typed.toTyped([100, true, 'this is baz']), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz' }), [100, true, 'this is baz'])
    assert.isUndefined(typed.toTyped([]))
    assert.isUndefined(typed.toTyped([100, true]))
    assert.isUndefined(typed.toTyped([100, 'this is baz']))
    assert.isUndefined(typed.toTyped([true, 'this is baz']))
    assert.isUndefined(typed.toTyped([100, true, 'this is baz', 1]))
    assert.isUndefined(typed.toTyped([undefined, true, '']))
    assert.isUndefined(typed.toTyped([1, true, undefined]))
    assert.isUndefined(typed.toTyped([undefined, true, undefined]))
    assert.deepStrictEqual(typed.toTyped([null, true, '']), { foo: null, bar: true, baz: '' })
    assert.deepStrictEqual(typed.toRepresentation({ foo: null, bar: true, baz: '' }), [null, true, ''])
    assert.deepStrictEqual(typed.toTyped([1, true, null]), { foo: 1, bar: true, baz: null })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 1, bar: true, baz: null }), [1, true, null])
    assert.deepStrictEqual(typed.toTyped([null, true, null]), { foo: null, bar: true, baz: null })
    assert.deepStrictEqual(typed.toRepresentation({ foo: null, bar: true, baz: null }), [null, true, null])
  })

  it('struct optionals', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', optional: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', optional: true }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'SimpleStruct')

    let map = { foo: 100, bar: true, baz: 'this is baz' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.isUndefined(typed.toTyped({}))
    // @ts-ignore
    map = { foo: 100, bar: true }
    assert.strictEqual(typed.toTyped(map), map)
    assert.isUndefined(typed.toTyped({ foo: 100, baz: 'this is baz' }))
    // @ts-ignore
    map = { bar: true, baz: 'this is baz' }
    assert.strictEqual(typed.toTyped(map), map)
    assert.isUndefined(typed.toTyped({ foo: 100, bar: true, baz: 'this is baz', nope: 1 }))
    assert.isUndefined(typed.toTyped({ foo: undefined, bar: true, baz: '' })) // the next 3 don't validator because 'undefined' isn't in the data model
    assert.isUndefined(typed.toTyped({ foo: 1, bar: true, baz: undefined }))
    assert.isUndefined(typed.toTyped({ foo: undefined, bar: true, baz: undefined }))
    // @ts-ignore
    map = { bar: true, baz: '' }
    assert.strictEqual(typed.toTyped(map), map)
    // @ts-ignore
    map = { foo: 1, bar: true }
    assert.strictEqual(typed.toTyped(map), map)
    // @ts-ignore
    map = { bar: true }
    assert.strictEqual(typed.toTyped(map), map)
  })

  it('struct with listpairs representation and optionals', async () => {
    const typed = await buildAndVerify({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', optional: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', optional: true }
            },
            representation: { listpairs: {} }
          }
        }
      }
    }, 'SimpleStruct')

    assert.deepStrictEqual(typed.toTyped([['foo', 100], ['bar', true], ['baz', 'this is baz']]), { foo: 100, bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 100, bar: true, baz: 'this is baz' }), [['foo', 100], ['bar', true], ['baz', 'this is baz']])
    assert.isUndefined(typed.toTyped([]))
    assert.deepStrictEqual(typed.toTyped([['foo', 100], ['bar', true]]), { foo: 100, bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 100, bar: true }), [['foo', 100], ['bar', true]])
    assert.isUndefined(typed.toRepresentation({ foo: 100, baz: 'this is baz' }))
    assert.deepStrictEqual(typed.toTyped([['bar', true], ['baz', 'this is baz']]), { bar: true, baz: 'this is baz' })
    assert.deepStrictEqual(typed.toRepresentation({ bar: true, baz: 'this is baz' }), [['bar', true], ['baz', 'this is baz']])
    assert.isUndefined(typed.toTyped([['foo', 100], ['bar', true], ['baz', 'this is baz'], ['nope', 1]]))
    assert.isUndefined(typed.toTyped([['foo', undefined], ['bar', true], ['baz', '']])) // the next 3 don't validator because 'undefined' isn't in the data model
    assert.isUndefined(typed.toTyped([['foo', 1], ['bar', true], ['baz', undefined]]))
    assert.isUndefined(typed.toTyped([['foo', undefined], ['bar', true], ['baz', undefined]]))
    assert.deepStrictEqual(typed.toTyped([['bar', true], ['baz', '']]), { bar: true, baz: '' })
    assert.deepStrictEqual(typed.toRepresentation({ bar: true, baz: '' }), [['bar', true], ['baz', '']])
    assert.deepStrictEqual(typed.toTyped([['foo', 1], ['bar', true]]), { foo: 1, bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ foo: 1, bar: true }), [['foo', 1], ['bar', true]])
    assert.deepStrictEqual(typed.toTyped([['bar', true]]), { bar: true })
    assert.deepStrictEqual(typed.toRepresentation({ bar: true }), [['bar', true]])
  })

  it('struct with anonymous types', async () => {
    /*
      type StructWithAnonymousTypes struct {
        fooField optional {String:String}
        barField nullable {String:String}
        bazField {String:nullable String}
        wozField {String:[nullable String]}
      }
    */
    const typed = await buildAndVerify({
      types: {
        StructWithAnonymousTypes: {
          struct: {
            fields: {
              fooField: {
                type: {
                  map: {
                    keyType: 'String',
                    valueType: 'String'
                  }
                },
                optional: true
              },
              barField: {
                type: {
                  map: {
                    keyType: 'String',
                    valueType: 'String'
                  }
                },
                nullable: true
              },
              bazField: {
                type: {
                  map: {
                    keyType: 'String',
                    valueType: 'String',
                    valueNullable: true
                  }
                }
              },
              wozField: {
                type: {
                  map: {
                    keyType: 'String',
                    valueType: {
                      list: {
                        valueType: 'String',
                        valueNullable: true
                      }
                    }
                  }
                }
              }
            },
            representation: {
              map: {}
            }
          }
        }
      }
    }, 'StructWithAnonymousTypes')

    assert.isUndefined(typed.toTyped({}))

    let map = {
      fooField: { s: '', a: 'b' },
      barField: { string: 'yep', a: 'b' },
      bazField: { bip: 'bop', a: 'b' },
      wozField: { hack: ['fip', 'fop'], gack: [] }
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)

    // @ts-ignore
    map = { fooField: {}, barField: {}, bazField: {}, wozField: {} }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    // @ts-ignore
    map = { barField: {}, bazField: {}, wozField: {} }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)

    // @ts-ignore
    map = {
      // @ts-ignore
      barField: { string: 'yep', a: 'b' },
      // @ts-ignore
      bazField: { bip: 'bop', a: 'b' },
      // @ts-ignore
      wozField: { hack: ['fip', 'fop'], gack: [] }
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)

    map = {
      // @ts-ignore
      barField: null,
      // @ts-ignore
      bazField: { bip: 'bop', a: 'b' },
      // @ts-ignore
      wozField: { hack: ['fip', 'fop'], gack: [] }
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)

    map = {
      // @ts-ignore
      barField: null,
      // @ts-ignore
      bazField: { bip: null, a: 'b' },
      // @ts-ignore
      wozField: { hack: ['fip', 'fop'], gack: [] }
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)

    map = {
      // @ts-ignore
      barField: null,
      // @ts-ignore
      bazField: { bip: null, a: 'b' },
      // @ts-ignore
      wozField: { hack: ['fip', null], gack: [] }
    }
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
  })

  it('empty struct', async () => {
    const typed = await buildAndVerify({
      types: {
        StructEmpty: {
          struct: {
            fields: {},
            representation: { map: {} }
          }
        }
      }
    }, 'StructEmpty')

    for (const obj of [101, 1.01, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], null, undefined]) {
      assert.isUndefined(typed.toTyped(obj))
      assert.isUndefined(typed.toRepresentation(obj))
    }

    const map = {}
    assert.strictEqual(typed.toTyped(map), map)
    assert.strictEqual(typed.toRepresentation(map), map)
    assert.isUndefined(typed.toTyped({ a: 1 }))
    assert.isUndefined(typed.toRepresentation({ a: 1 }))
  })

  it('empty tuple struct', async () => {
    const typed = await buildAndVerify({
      types: {
        StructTupleEmpty: {
          struct: {
            fields: {},
            representation: { tuple: {} }
          }
        }
      }
    }, 'StructTupleEmpty')

    for (const obj of [101, 1.01, 'a string', false, true, fauxCid, Uint8Array.from([1, 2, 3]), [1, 2, 3], null, undefined]) {
      assert.isUndefined(typed.toTyped(obj))
      assert.isUndefined(typed.toRepresentation(obj))
      assert.isUndefined(typed.toTyped([obj]))
      assert.isUndefined(typed.toRepresentation([obj]))
    }

    assert.deepStrictEqual(typed.toTyped([]), {})
    assert.deepStrictEqual(typed.toRepresentation({}), [])
  })

  it('struct with renames', async () => {
    /*
      type StructAsMapWithRenames struct {
        bar Bool (rename "b")
        boom String
        baz String (rename "z")
        foo Int (rename "f" implicit "0")
      }
    */
    const typed = await buildAndVerify({
      types: {
        StructAsMapWithRenames: {
          struct: {
            fields: {
              bar: { type: 'Bool' },
              boom: { type: 'String' },
              baz: { type: 'String' },
              foo: { type: 'Int' }
            },
            representation: {
              map: {
                fields: {
                  bar: { rename: 'b' },
                  baz: { rename: 'z' },
                  foo: { rename: 'f' }
                }
              }
            }
          }
        }
      }
    }, 'StructAsMapWithRenames')

    assert.isUndefined(typed.toTyped({ bar: true, boom: 'str', baz: 'str', foo: 100 }))
    assert.isUndefined(typed.toRepresentation({ b: true, boom: 'str', z: 'str', f: 100 }))
    assert.isUndefined(typed.toTyped({ bar: true, boom: 'str', baz: 'str', b: 'str', z: 'str', f: 100, foo: 100 }))
    assert.isUndefined(typed.toRepresentation({ bar: true, boom: 'str', baz: 'str', b: 'str', z: 'str', f: 100, foo: 100 }))
    assert.deepStrictEqual(
      typed.toTyped({ b: true, boom: 'str', z: 'str', f: 100 }),
      { bar: true, boom: 'str', baz: 'str', foo: 100 }
    )
    assert.deepStrictEqual(
      typed.toRepresentation({ bar: true, boom: 'str', baz: 'str', foo: 100 }),
      { b: true, boom: 'str', z: 'str', f: 100 }
    )
  })

  it('struct with implicits', async () => {
    /*
      type StructAsMapWithImplicits struct {
        bar Bool (implicit "false")
        boom String (implicit "yay")
        baz String
        foo Int (implicit "0")
      }
    */
    const typed = await buildAndVerify({
      types: {
        StructAsMapWithImplicits: {
          struct: {
            fields: {
              bar: { type: 'Bool' },
              boom: { type: 'String' },
              baz: { type: 'String' },
              foo: { type: 'Int' }
            },
            representation: {
              map: {
                fields: {
                  bar: { implicit: false },
                  boom: { implicit: 'yay' },
                  foo: { implicit: 0 }
                }
              }
            }
          }
        }
      }
    }, 'StructAsMapWithImplicits')

    const map = { bar: true, boom: 'str', baz: 'str', foo: 100 }
    assert.strictEqual(typed.toTyped(map), map)
    assert.deepStrictEqual(
      typed.toTyped({ boom: 'str', baz: 'str', foo: 100 }),
      { bar: false, boom: 'str', baz: 'str', foo: 100 }
    )
    assert.deepStrictEqual(
      typed.toTyped({ baz: 'str', foo: 100 }),
      { bar: false, boom: 'yay', baz: 'str', foo: 100 }
    )
    assert.deepStrictEqual(
      typed.toTyped({ baz: 'str' }),
      { bar: false, boom: 'yay', baz: 'str', foo: 0 }
    )
    assert.isUndefined(typed.toTyped({}))
  })

  it('tuple with custom fieldOrder', async () => {
    /*
      type StructAsTupleWithCustomFieldorder struct {
        foo Int
        bar Bool
        baz String
      } representation tuple {
        fieldOrder ["baz", "bar", "foo"]
      }
    */
    const typed = await buildAndVerify({
      types: {
        StructAsTupleWithCustomFieldorder: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: {
              tuple: {
                fieldOrder: ['baz', 'bar', 'foo']
              }
            }
          }
        }
      }
    }, 'StructAsTupleWithCustomFieldorder')

    assert.isUndefined(typed.toTyped([100, true, 'this is baz']))
    assert.deepStrictEqual(
      typed.toTyped(['this is baz', true, 100]),
      {
        baz: 'this is baz',
        bar: true,
        foo: 100
      }
    )
  })
})
