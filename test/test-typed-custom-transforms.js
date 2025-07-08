/* eslint-env mocha */

import { create, safeReference, safeFieldReference } from '../lib/typed.js'
import { fromDSL } from '../lib/from-dsl.js'
import { assert } from 'chai'

describe('Custom Transforms', () => {
  it('should apply custom transforms for base64 bytes', () => {
    const schema = fromDSL(`
type Base64Bytes bytes
type MyData struct {
  data Base64Bytes
}`)

    const customTransforms = {
      Base64Bytes: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            // Decode base64 to Uint8Array
            const binary = atob(obj)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            return bytes
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (!(obj instanceof Uint8Array)) return undefined
          // Encode Uint8Array to base64
          let binary = ''
          for (let i = 0; i < obj.length; i++) {
            binary += String.fromCharCode(obj[i])
          }
          return btoa(binary)
        }`
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'MyData', { customTransforms })

    // Test base64 to Uint8Array
    const wireData = { data: 'SGVsbG8gV29ybGQ=' } // "Hello World" in base64
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.ok(typed.data instanceof Uint8Array)
    assert.equal(new TextDecoder().decode(typed.data), 'Hello World')

    // Test Uint8Array to base64
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should apply custom transforms for string bigints', () => {
    const schema = fromDSL(`
type StringBigInt int
type Account struct {
  balance StringBigInt
}`)

    const customTransforms = {
      StringBigInt: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            return BigInt(obj)
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (typeof obj !== 'bigint') return undefined
          return obj.toString()
        }`
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'Account', { customTransforms })

    // Test string to bigint
    const wireData = { balance: '123456789012345678901234567890' }
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typeof typed.balance, 'bigint')
    assert.equal(typed.balance, 123456789012345678901234567890n)

    // Test bigint to string
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should handle function transforms', () => {
    const schema = fromDSL(`
type UpperString string
type Message struct {
  text UpperString
}`)

    const customTransforms = {
      UpperString: {
        toTyped: /** @type {(obj: any) => any} */ (obj) => {
          if (typeof obj !== 'string') return undefined
          return obj.toUpperCase()
        },
        toRepresentation: /** @type {(obj: any) => any} */ (obj) => {
          if (typeof obj !== 'string') return undefined
          return obj.toLowerCase()
        }
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'Message', { customTransforms })

    // Test lowercase to uppercase
    const wireData = { text: 'hello world' }
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typed.text, 'HELLO WORLD')

    // Test uppercase to lowercase
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should handle custom transforms in lists', () => {
    const schema = fromDSL(`
type Base64Bytes bytes
type DataList [Base64Bytes]`)

    const customTransforms = {
      Base64Bytes: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            const binary = atob(obj)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            return bytes
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (!(obj instanceof Uint8Array)) return undefined
          let binary = ''
          for (let i = 0; i < obj.length; i++) {
            binary += String.fromCharCode(obj[i])
          }
          return btoa(binary)
        }`
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'DataList', { customTransforms })

    // Test list of base64 strings
    const wireData = ['SGVsbG8=', 'V29ybGQ='] // ["Hello", "World"]
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typed.length, 2)
    assert.ok(typed[0] instanceof Uint8Array)
    assert.ok(typed[1] instanceof Uint8Array)
    assert.equal(new TextDecoder().decode(typed[0]), 'Hello')
    assert.equal(new TextDecoder().decode(typed[1]), 'World')

    // Test back to base64
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should handle custom transforms in maps', () => {
    const schema = fromDSL(`
type StringBigInt int
type BalanceMap {String:StringBigInt}`)

    const customTransforms = {
      StringBigInt: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            return BigInt(obj)
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (typeof obj !== 'bigint') return undefined
          return obj.toString()
        }`
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'BalanceMap', { customTransforms })

    // Test map with string bigints
    const wireData = {
      alice: '1000000000000000000',
      bob: '2000000000000000000'
    }
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typeof typed.alice, 'bigint')
    assert.equal(typeof typed.bob, 'bigint')
    assert.equal(typed.alice, 1000000000000000000n)
    assert.equal(typed.bob, 2000000000000000000n)

    // Test back to strings
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should handle custom transforms with nullable fields', () => {
    const schema = fromDSL(`
type StringBigInt int
type Account struct {
  balance nullable StringBigInt
}`)

    const customTransforms = {
      StringBigInt: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            return BigInt(obj)
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (typeof obj !== 'bigint') return undefined
          return obj.toString()
        }`
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'Account', { customTransforms })

    // Test with null value
    const nullData = { balance: null }
    const typedNull = toTyped(nullData)
    assert.ok(typedNull)
    assert.strictEqual(typedNull.balance, null)
    const reprNull = toRepresentation(typedNull)
    assert.deepEqual(reprNull, nullData)

    // Test with string value
    const wireData = { balance: '12345' }
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typeof typed.balance, 'bigint')
    assert.equal(typed.balance, 12345n)
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, wireData)
  })

  it('should handle custom transforms with optional fields', () => {
    const schema = fromDSL(`
type StringBigInt int
type Account struct {
  name String
  balance optional StringBigInt
}`)

    const customTransforms = {
      StringBigInt: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            return BigInt(obj)
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (typeof obj !== 'bigint') return undefined
          return obj.toString()
        }`
      }
    }

    const { toTyped } = create(schema, 'Account', { customTransforms })

    // Test without optional field
    const withoutBalance = { name: 'Alice' }
    const typedWithout = toTyped(withoutBalance)
    assert.ok(typedWithout)
    assert.equal(typedWithout.name, 'Alice')
    assert.strictEqual(typedWithout.balance, undefined)

    // Test with optional field
    const withBalance = { name: 'Bob', balance: '999999' }
    const typedWith = toTyped(withBalance)
    assert.ok(typedWith)
    assert.equal(typedWith.name, 'Bob')
    assert.equal(typeof typedWith.balance, 'bigint')
    assert.equal(typedWith.balance, 999999n)
  })

  it('should handle custom transforms in unions', () => {
    const schema = fromDSL(`
type StringBigInt int
type NumberOrBigInt union {
  | Int "number"
  | StringBigInt "bigint"
} representation keyed`)

    const customTransforms = {
      StringBigInt: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          try {
            return BigInt(obj)
          } catch {
            return undefined
          }
        }`,
        toRepresentation: `(obj) => {
          if (typeof obj !== 'bigint') return undefined
          return obj.toString()
        }`
      }
    }

    const { toTyped } = create(schema, 'NumberOrBigInt', { customTransforms })

    // Test regular number
    const numberData = { number: 42 }
    const typedNumber = toTyped(numberData)
    assert.ok(typedNumber)
    assert.deepEqual(typedNumber, { Int: 42 })

    // Test bigint
    const bigintData = { bigint: '99999999999999999999' }
    const typedBigint = toTyped(bigintData)
    assert.ok(typedBigint)
    assert.equal(typeof typedBigint.StringBigInt, 'bigint')
    assert.equal(typedBigint.StringBigInt, 99999999999999999999n)
  })

  it('should default toRepresentation to identity when not provided', () => {
    const schema = fromDSL(`
type OnlyToTyped string
type Message struct {
  text OnlyToTyped
}`)

    const customTransforms = {
      OnlyToTyped: {
        toTyped: `(obj) => {
          if (typeof obj !== 'string') return undefined
          return obj.toUpperCase()
        }`
        // No toRepresentation provided
      }
    }

    const { toTyped, toRepresentation } = create(schema, 'Message', { customTransforms })

    // Test toTyped transform
    const wireData = { text: 'hello' }
    const typed = toTyped(wireData)
    assert.ok(typed)
    assert.equal(typed.text, 'HELLO')

    // Test toRepresentation (should return unchanged)
    const repr = toRepresentation(typed)
    assert.deepEqual(repr, { text: 'HELLO' })
  })

  it('should throw on invalid transform type', () => {
    const schema = fromDSL(`
type BadTransform string`)

    const customTransforms = /** @type {any} */ ({
      BadTransform: {
        toTyped: 123 // Invalid - not a string or function
      }
    })

    assert.throws(() => {
      create(schema, 'BadTransform', { customTransforms })
    }, /Invalid toTyped transform/)
  })

  it('should handle invalid input in custom transforms', () => {
    const schema = fromDSL(`
type ValidatedString string
type Data struct {
  content ValidatedString
}`)

    const customTransforms = {
      ValidatedString: {
        toTyped: `(obj) => {
          // Only accept strings that start with 'valid:'
          if (typeof obj === 'string' && obj.startsWith('valid:')) {
            return obj
          }
          return undefined
        }`
      }
    }

    const { toTyped } = create(schema, 'Data', { customTransforms })

    // Should fail validation for invalid input
    const result = toTyped({ content: 'invalid-string' })
    assert.strictEqual(result, undefined)

    // Should pass validation for valid input
    const validResult = toTyped({ content: 'valid:hello' })
    assert.ok(validResult)
    assert.equal(validResult.content, 'valid:hello')
  })

  it('should handle errors in custom transforms gracefully', () => {
    const schema = fromDSL(`
type ThrowingType string
type Data struct {
  value ThrowingType
}`)

    const customTransforms = {
      ThrowingType: {
        toTyped: `(obj) => {
          throw new Error('Intentional error')
        }`
      }
    }

    const { toTyped } = create(schema, 'Data', { customTransforms })

    // Should handle the error and return undefined
    assert.throws(() => {
      toTyped({ value: 'test' })
    }, /Intentional error/)
  })
})

describe('toJS exports for custom transforms', () => {
  it('should include safeReference and safeFieldReference exports', () => {
    // Just verify they are exported and work
    assert.equal(safeReference('simple'), '.simple')
    assert.equal(safeReference('with-dash'), "['with-dash']")
    assert.equal(safeReference('123start'), "['123start']")

    assert.equal(safeFieldReference('simple'), 'simple')
    assert.equal(safeFieldReference('with-dash'), "'with-dash'")
    assert.equal(safeFieldReference('123start'), "'123start'")
  })
})
