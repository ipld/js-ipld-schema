/* eslint-env mocha */

import { create } from '@ipld/schema/typed.js'
import * as chai from 'chai'

const { assert } = chai

describe('Errors', () => {
  it('invalid schema definition', () => {
    // @ts-ignore
    assert.throws(() => create({}, 'blip'), /Invalid schema definition/)
  })

  it('no root', () => {
    // @ts-ignore
    assert.throws(() => create({ types: {} }), /A root is required/)
    // @ts-ignore
    assert.throws(() => create({ types: {} }, ''), /A root is required/)
    // @ts-ignore
    assert.throws(() => create({ types: {} }, null), /A root is required/)
    // @ts-ignore
    assert.throws(() => create({ types: {} }, 100), /A root is required/)
  })

  it('bad type kind', () => {
    assert.throws(() => create({
      types: {
        $map: {
          // @ts-ignore
          blip: {
            keyType: 'String',
            valueType: 'Int'
          }
        }
      }
    }, '$map'), /type kind: "blip"/)
  })

  it('multiple kinds', () => {
    assert.throws(() => create({
      types: {
        boo: { bool: {}, int: {} }
      }
    }, 'boo'), /Malformed type definition: expected single kind key \("boo"\)/)
  })

  it('no kind', () => {
    assert.throws(() => create({
      types: {
        // @ts-ignore
        boo: { }
      }
    }, 'boo'), /Malformed type definition: empty \("boo"\)/)
  })

  it('recursive map kind', () => {
    assert.throws(() => create({
      types: {
        $map: {
          map: {
            keyType: 'String',
            valueType: '$map'
          }
        }
      }
    }, '$map'), /Recursive typedef in type "\$map"/)
  })

  it('recursive list kind', () => {
    assert.throws(() => create({
      types: {
        $list: {
          list: {
            valueType: '$list'
          }
        }
      }
    }, '$list'), /Recursive typedef in type "\$list"/)
  })

  it('invalid map keyType', () => {
    assert.throws(() => create({
      types: {
        $map: {
          map: {
            keyType: 'Bytes',
            valueType: 'Int'
          }
        }
      }
    }, '$map'), /Invalid keyType for Map "\$map", expected String, found "Bytes"/)
  })

  it('invalid root', () => {
    assert.throws(() => create({
      types: {
        $list: {
          list: {
            valueType: 'String'
          }
        }
      }
    }, 'blip'), /A type must match an existing type definition \("blip"\)/)
  })

  describe('invalid typedef', () => {
    it('array', () => {
      assert.throws(() => create({
        types: {
          // @ts-ignore
          $list: []
        }
      }, '$list'), /Malformed type definition: not an object: \("\$list"\)/)
    })
    it('null', () => {
      assert.throws(() => create({
        types: {
          // @ts-ignore
          $list: null
        }
      }, '$list'), /Malformed type definition: not an object: \("\$list"\)/)
    })
    it('other', () => {
      assert.throws(() => create({
        types: {
          // @ts-ignore
          $list: true
        }
      }, '$list'), /Malformed type definition: not an object: \("\$list"\)/)
    })
  })

  it('invalid reference', () => {
    assert.throws(() => create({
      types: {
        $list: {
          list: {
            valueType: 'boop'
          }
        }
      }
    }, '$list'), /A type must match an existing type definition \("boop"\)/)
  })

  it('bad valueType', () => {
    assert.throws(() => create({
      types: {
        AMap: {
          map: {
            keyType: 'String',
            // @ts-ignore
            valueType: [],
            representation: { map: {} }
          }
        }
      }
    }, 'AMap'), /Bad type for "valueType" in "AMap"/)

    assert.throws(() => create({
      types: {
        AList: {
          list: {
            // @ts-ignore
            valueType: true
          }
        }
      }
    }, 'AList'), /Bad type for "valueType" in "AList"/)
  })

  it('bad map representation', () => {
    assert.throws(() => create({
      types: {
        AMap: {
          map: {
            keyType: 'String',
            valueType: 'String',
            // @ts-ignore
            representation: { blip: {} }
          }
        }
      }
    }, 'AMap'), /Unsupported map representation "blip"/)
  })

  it('bad struct representation', () => {
    assert.throws(() => create({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', optional: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', optional: true }
            },
            // @ts-ignore
            representation: { blip: {} }
          }
        }
      }
    }, 'SimpleStruct'), /Unsupported struct representation for "SimpleStruct": "blip"/)
  })

  it('non-map struct with optionals', () => {
    assert.throws(() => create({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int', optional: true },
              bar: { type: 'Bool' },
              baz: { type: 'String', optional: true }
            },
            representation: { tuple: {} }
          }
        }
      }
    }, 'SimpleStruct'), /Struct "SimpleStruct" includes "optional" fields for non-map struct/)
  })

  it('unsupported struct implicit type', () => {
    assert.throws(() => create({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            // @ts-ignore
            representation: {
              map: {
                fields: {
                  bar: { implicit: new Uint8Array(0) }
                }
              }
            }
          }
        }
      }
    }, 'SimpleStruct'), /Unsupported implicit type for "SimpleStruct" -> "bar":/)
  })

  it('tuple struct with bad fieldOrder field names', () => {
    assert.throws(() => create({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: {
              tuple: {
                fieldOrder: ['nope', 'yep', 'alrighty']
              }
            }
          }
        }
      }
    }, 'SimpleStruct'), /Struct "SimpleStruct" with tuple representation "fieldOrder" does not match the struct field names/)
  })

  it('tuple struct with bad fieldOrder field count', () => {
    assert.throws(() => create({
      types: {
        SimpleStruct: {
          struct: {
            fields: {
              foo: { type: 'Int' },
              bar: { type: 'Bool' },
              baz: { type: 'String' }
            },
            representation: {
              tuple: {
                fieldOrder: ['foo', 'baz']
              }
            }
          }
        }
      }
    }, 'SimpleStruct'), /Struct "SimpleStruct" with tuple representation "fieldOrder" does not match the struct field count/)
  })

  it('bad union', () => {
    assert.throws(() => create({
      types: {
        UnionUnknown: {
          // @ts-ignore
          union: {}
        }
      }
    }, 'UnionUnknown'), /Bad union definition for "UnionUnknown"/)
  })

  it('bad envelope union', () => {
    assert.throws(() => create({
      types: {
        UnionInline: {
          union: {
            representation: {
              // @ts-ignore
              inline: {
                discriminantKey: 'tag'
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
              bral: { type: 'String' }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'UnionInline'), /Expected "discriminantTable" for inline union "UnionInline"/)

    assert.throws(() => create({
      types: {
        UnionInline: {
          union: {
            representation: {
              // @ts-ignore
              inline: {
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
              bral: { type: 'String' }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'UnionInline'), /Expected "discriminantKey" for inline union "UnionInline"/)
  })

  it('bad envelope union', () => {
    assert.throws(() => create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionEnvelope: {
          union: {
            representation: {
              // @ts-ignore
              envelope: {
                discriminantKey: 'bim',
                contentKey: 'bam'
              }
            }
          }
        }
      }
    }, 'UnionEnvelope'), /Expected "discriminantTable" for envelope union "UnionEnvelope"/)

    assert.throws(() => create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionEnvelope: {
          union: {
            representation: {
              // @ts-ignore
              envelope: {
                contentKey: 'bim',
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
    }, 'UnionEnvelope'), /Expected "discriminantKey" for envelope union "UnionEnvelope"/)

    assert.throws(() => create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionEnvelope: {
          union: {
            representation: {
              // @ts-ignore
              envelope: {
                discriminantKey: 'bim',
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
    }, 'UnionEnvelope'), /Expected "contentKey" for envelope union "UnionEnvelope"/)
  })

  it('bad union type name', () => {
    assert.throws(() => create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionKinded: {
          union: {
            representation: {
              kinded: {
                map: 'Foo',
                list: 'Bar',
                // @ts-ignore
                int: {}
              }
            }
          }
        }
      }
    }, 'UnionKinded'), /Kinded union "UnionKinded" refers to non-string type name: \{\}/)

    // @ts-ignore
    assert.throws(() => create({
      types: {
        UnionKeyed: {
          union: {
            representation: {
              // @ts-ignore
              keyed: {
                bar: 'Bool',
                foo: 'Int',
                // @ts-ignore
                baz: ['nope']
              }
            }
          }
        }
      }
    }, 'UnionKeyed'), /Keyed union "UnionKeyed" refers to non-string type name: \["nope"\]/)

    assert.throws(() => create({
      types: {
        UnionInline: {
          union: {
            representation: {
              inline: {
                discriminantKey: 'tag',
                // @ts-ignore
                discriminantTable: {
                  foo: 'Foo',
                  // @ts-ignore
                  bar: 100
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
              bral: { type: 'String' }
            },
            representation: { map: {} }
          }
        }
      }
    }, 'UnionInline'), /Inline union "UnionInline" refers to non-string type name: 100/)

    assert.throws(() => create({
      types: {
        Bar: { bool: {} },
        Baz: { string: {} },
        Foo: { int: {} },
        UnionEnvelope: {
          union: {
            representation: {
              envelope: {
                discriminantKey: 'bim',
                contentKey: 'bam',
                discriminantTable: {
                  foo: 'Foo',
                  // @ts-ignore
                  bar: true,
                  baz: 'Baz'
                }
              }
            }
          }
        }
      }
    }, 'UnionEnvelope'), /Envelope union "UnionEnvelope" refers to non-string type name: true/)
  })

  it('bad bytesprefix byte', () => {
    assert.throws(() => create({
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
                  '-01': 'Bls12_381Signature'
                }
              }
            }
          }
        }
      }
    }, 'Signature'), /Invalid bytesprefix byte for "Signature": "-01"/)
  })

  it('bad bytesprefix type ref', () => {
    assert.throws(() => create({
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
                  // @ts-ignore
                  '00': {},
                  '-01': 'Bls12_381Signature'
                }
              }
            }
          }
        }
      }
    }, 'Signature'), /Bytesprefix union "Signature" refers to non-string type name: {}/)
  })

  it('bad union type', () => {
    assert.throws(() => create({
      types: {
        UnionKeyed: {
          union: {
            representation: {
              // @ts-ignore
              blip: { }
            }
          }
        }
      }
    }, 'UnionKeyed'), /Unsupported union type for "UnionKeyed": "blip"/)
  })

  it('bad enum descriptor', () => {
    assert.throws(() => create({
      types: {
        SimpleEnum: {
          // @ts-ignore
          enum: {}
        }
      }
    }, 'SimpleEnum'), /Enum needs a "members" list/)
  })

  it('bad string enum rename values', () => {
    assert.throws(() => create({
      types: {
        SimpleEnum: {
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              string: {
                Foo: 'str',
                // @ts-ignore
                Bar: 0
              }
            }
          }
        }
      }
    }, 'SimpleEnum'), /Enum members must be strings/)
  })

  it('bad int enum rename values', () => {
    assert.throws(() => create({
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
                // @ts-ignore
                Foo: 'str',
                Bar: 0
              }
            }
          }
        }
      }
    }, 'SimpleEnum'), /Enum members must be ints/)
  })

  it('no enum representation', () => {
    assert.throws(() => create({
      types: {
        SimpleEnum: {
          // @ts-ignore
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ]
          }
        }
      }
    }, 'SimpleEnum'), /Enum doesn't have a valid representation/)
  })

  it('bad enum representation type', () => {
    assert.throws(() => create({
      types: {
        SimpleEnum: {
          enum: {
            members: [
              'Foo',
              'Bar',
              'Baz'
            ],
            representation: {
              // @ts-ignore
              nope: {}
            }
          }
        }
      }
    }, 'SimpleEnum'), /Enum doesn't have a valid representation/)
  })
})
