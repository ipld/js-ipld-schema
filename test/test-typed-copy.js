/* eslint-env mocha */

import { fromDSL } from '../lib/from-dsl.js'
import { create } from '../lib/typed.js'
import { assert } from 'chai'

describe('Copy types', () => {
  it('should support copy types with basic types', () => {
    const schema = fromDSL(`type UserID = String
type Age = Int
type Balance = Float
type Data = Bytes`)

    const typed = create(schema, 'UserID')

    // Test UserID (copy of String)
    assert.strictEqual(typed.toTyped('test-user-123'), 'test-user-123')
    assert.strictEqual(typed.toRepresentation('test-user-123'), 'test-user-123')
    assert.isUndefined(typed.toTyped(123))
    assert.isUndefined(typed.toTyped(null))

    // Test Age (copy of Int)
    const ageTyped = create(schema, 'Age')
    assert.strictEqual(ageTyped.toTyped(25), 25)
    assert.strictEqual(ageTyped.toRepresentation(25), 25)
    assert.isUndefined(ageTyped.toTyped('25'))
    assert.isUndefined(ageTyped.toTyped(25.5))

    // Test Balance (copy of Float)
    const balanceTyped = create(schema, 'Balance')
    assert.strictEqual(balanceTyped.toTyped(123.45), 123.45)
    assert.strictEqual(balanceTyped.toRepresentation(123.45), 123.45)
    assert.isUndefined(balanceTyped.toTyped('123.45'))

    // Test Data (copy of Bytes)
    const dataTyped = create(schema, 'Data')
    const bytes = new Uint8Array([1, 2, 3, 4])
    assert.deepEqual(dataTyped.toTyped(bytes), bytes)
    assert.deepEqual(dataTyped.toRepresentation(bytes), bytes)
    assert.isUndefined(dataTyped.toTyped([1, 2, 3, 4]))
  })

  it('should support copy types with complex types', () => {
    const schema = fromDSL(`type Person struct {
  name String
  age Int
}

type Employee = Person

type Status enum {
  | Active
  | Inactive
  | Pending
} representation string

type UserStatus = Status`)

    // Test Employee (copy of Person struct)
    const employeeTyped = create(schema, 'Employee')
    const person = { name: 'Alice', age: 30 }
    assert.deepEqual(employeeTyped.toTyped(person), person)
    assert.deepEqual(employeeTyped.toRepresentation(person), person)
    assert.isUndefined(employeeTyped.toTyped({ name: 'Bob' })) // missing age
    assert.isUndefined(employeeTyped.toTyped({ name: 'Bob', age: '30' })) // wrong type for age

    // Test UserStatus (copy of Status enum)
    const statusTyped = create(schema, 'UserStatus')
    assert.strictEqual(statusTyped.toTyped('Active'), 'Active')
    assert.strictEqual(statusTyped.toRepresentation('Active'), 'Active')
    assert.strictEqual(statusTyped.toTyped('Inactive'), 'Inactive')
    assert.isUndefined(statusTyped.toTyped('Unknown'))
    assert.isUndefined(statusTyped.toTyped(123))
  })

  it('should support chained copy types', () => {
    const schema = fromDSL(`type ID = String
type UserIdentifier = ID
type AdminID = UserIdentifier`)

    const adminTyped = create(schema, 'AdminID')
    assert.strictEqual(adminTyped.toTyped('admin-123'), 'admin-123')
    assert.strictEqual(adminTyped.toRepresentation('admin-123'), 'admin-123')
    assert.isUndefined(adminTyped.toTyped(123))
    assert.isUndefined(adminTyped.toTyped(null))
  })

  it('should support copy types with list and map types', () => {
    const schema = fromDSL(`type Names [String]
type TeamMembers = Names

type Settings {String: String}
type Configuration = Settings`)

    // Test TeamMembers (copy of Names list)
    const teamTyped = create(schema, 'TeamMembers')
    const names = ['Alice', 'Bob', 'Charlie']
    assert.deepEqual(teamTyped.toTyped(names), names)
    assert.deepEqual(teamTyped.toRepresentation(names), names)
    assert.isUndefined(teamTyped.toTyped(['Alice', 123, 'Bob'])) // invalid element type
    assert.isUndefined(teamTyped.toTyped('Alice')) // not a list

    // Test Configuration (copy of Settings map)
    const configTyped = create(schema, 'Configuration')
    const settings = { theme: 'dark', language: 'en' }
    assert.deepEqual(configTyped.toTyped(settings), settings)
    assert.deepEqual(configTyped.toRepresentation(settings), settings)
    assert.isUndefined(configTyped.toTyped({ theme: 'dark', count: 5 })) // invalid value type
    assert.isUndefined(configTyped.toTyped('settings')) // not a map
  })

  it('should handle forward references in copy types', () => {
    const schema = fromDSL(`type B = A
type A = String`)

    const bTyped = create(schema, 'B')
    assert.strictEqual(bTyped.toTyped('test'), 'test')
    assert.strictEqual(bTyped.toRepresentation('test'), 'test')
    assert.isUndefined(bTyped.toTyped(123))
  })

  it('should throw error for unknown type references', () => {
    const schema = fromDSL('type A = UnknownType')

    assert.throws(() => {
      create(schema, 'A')
    }, /Copy type "A" references unknown type "UnknownType"/)
  })

  it('should throw error for invalid copy type definition', () => {
    const schema = {
      types: {
        A: {
          copy: {
            // missing fromType
          }
        }
      }
    }

    assert.throws(() => {
      // @ts-ignore - Testing invalid schema
      create(schema, 'A')
    }, /Copy type "A" needs a "fromType" string/)
  })
})
