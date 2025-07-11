# @ipld/schema

JavaScript [IPLD](http://ipld.io/) Schema parser, validator, and code generator.

## What are IPLD Schemas?

IPLD Schemas define a type system for content-addressed data. Think of them like TypeScript or Protocol Buffers, but designed for immutable, linked data structures. They help you:

- 🛡️ **Validate** that your data matches an expected structure
- 🔄 **Transform** between compact binary formats and developer-friendly JSON
- 🏗️ **Generate** type-safe code in multiple languages (Go, Rust, TypeScript)
- 🔗 **Link** between data structures using content identifiers (CIDs)

Learn more at https://ipld.io/docs/schemas/

## Features

- **Parse and validate** IPLD Schema DSL (Domain Specific Language)
- **Runtime validation** with automatic format conversion
- **Code generation** for Go, Rust, and TypeScript
- **Advanced type features**: optional fields, defaults, renames, type aliases
- **Multiple data representations** for space-efficient storage
- **CLI tools** for validation and code generation

## Installation

```bash
npm install @ipld/schema
```

For CLI usage:
```bash
npm install -g @ipld/schema
```

## Quick Start

### Basic Schema Definition

IPLD Schemas use a simple, readable syntax:

```js
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { create } from '@ipld/schema/typed.js'

// Define your schema
const schema = fromDSL(`
  # A simple user profile schema
  type UserProfile struct {
    username String
    email String
    age Int
    isActive Bool
  }
`)

// Create a validator
const validator = create(schema, 'UserProfile')

// Validate some data
const userData = {
  username: 'alice',
  email: 'alice@example.com',
  age: 25,
  isActive: true
}

const validatedData = validator.toTyped(userData)
if (validatedData === undefined) {
  console.error('Invalid data!')
} else {
  console.log('Valid user profile:', validatedData)
}
```

## Schema Language Basics

### Basic Types

```ipldsch
type MyString String     # UTF-8 string
type MyInt Int           # Signed integer
type MyFloat Float       # Floating point
type MyBool Bool         # Boolean
type MyBytes Bytes       # Binary data
type MyLink &Any         # IPLD Link (CID)
```

### Structs (Objects)

```ipldsch
type Person struct {
  name String
  age Int
  email String optional          # Optional field
  nickname String (implicit "")  # Default value
}
```

### Lists and Maps

```ipldsch
# List of strings
type Names [String]

# Map from string to integers
type Scores {String: Int}

# Nested structures
type Team struct {
  name String
  members [Person]
  metadata {String: String}
}
```

### Enums

```ipldsch
type Status enum {
  | Active
  | Inactive
  | Pending
}

# With custom string values
type Color enum {
  | Red ("red")
  | Green ("green")
  | Blue ("blue")
} representation string
```

### Type Aliases

```ipldsch
type UserID = String
type Timestamp = Int
type EmailAddress = String
```

## Data Representations

IPLD Schemas separate the logical structure (what developers work with) from the storage format (how it's encoded). This allows for space-efficient storage while maintaining developer-friendly APIs.

### Example: Tuple Representation

```js
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { create } from '@ipld/schema/typed.js'

const schema = fromDSL(`
  # Store as array instead of object to save space
  type Point struct {
    x Float
    y Float
  } representation tuple
`)

const validator = create(schema, 'Point')

// Work with nice objects in your code
const point = { x: 10.5, y: 20.3 }

// But it's stored as a compact array
const stored = validator.toRepresentation(point)
console.log(stored) // [10.5, 20.3]

// And automatically converted back
const restored = validator.toTyped(stored)
console.log(restored) // { x: 10.5, y: 20.3 }
```

## Code Generation

Generate type-safe code from your schemas:

### Go

```js
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { generateGo } from '@ipld/schema/gen/go.js'

const schema = fromDSL(`
  type Person struct {
    name String
    age Int optional
  }
`)

const goCode = generateGo(schema, { packageName: 'person' })
// Generates Go structs with proper JSON tags and pointer types for optionals
```

### Rust

```js
import { generateRust } from '@ipld/schema/gen/rust.js'

const rustCode = generateRust(schema)
// Generates Rust structs with serde derives and Option<T> for optionals
```

### TypeScript

```js
import { generateTypeScript } from '@ipld/schema/gen/typescript.js'

const tsCode = generateTypeScript(schema)
// Generates TypeScript interfaces and runtime validators
```

## Advanced Features

### Field Renames

Control JSON field names separately from your schema field names:

```ipldsch
type ServerConfig struct {
  serverPort Int (rename "server_port")
  debugMode Bool (rename "debug_mode")
  apiKey String (rename "api_key")
}
```

### Annotations

Add language-specific type information:

```ipldsch
# Use big integers in Go
# @gotype(big.Int)
type Balance Int

type Transaction struct {
  # Custom serialization in Rust
  # @rustserde(with = "chrono::serde::ts_seconds")
  timestamp Int

  # Multiple annotations
  # @gotag(`json:"tx_id" db:"transaction_id"`)
  id String
}
```

### Custom Transforms

Handle special encoding requirements:

```js
const customTransforms = {
  Base64String: {
    // Decode base64 strings to bytes
    toTyped: (str) => {
      try {
        return Uint8Array.from(atob(str), c => c.charCodeAt(0))
      } catch {
        return undefined
      }
    },
    // Encode bytes to base64 strings
    toRepresentation: (bytes) => {
      return btoa(String.fromCharCode(...bytes))
    }
  }
}

const validator = create(schema, 'MyType', { customTransforms })
```

## Command Line Interface

The `ipld-schema` command provides tools for working with schemas:

### Validation

```bash
# Validate schema files
ipld-schema validate schema.ipldsch

# Extract and validate schemas from markdown
ipld-schema validate README.md
```

### Conversion

```bash
# Convert to JSON format
ipld-schema to-json schema.ipldsch

# Pretty print as canonical schema
ipld-schema to-schema schema.ipldsch
```

### Code Generation

```bash
# Generate JavaScript validators
ipld-schema to-js schema.ipldsch

# Generate TypeScript definitions
ipld-schema to-tsdefs schema.ipldsch
```

## API Reference

### Parsing Schemas

- `fromDSL(dsl: string)` - Parse schema DSL into an AST
- `toDSL(schema: Schema)` - Convert AST back to DSL

### Validation

- `create(schema: Schema, type: string, options?)` - Create a validator
  - Returns `{ toTyped, toRepresentation }`
  - `toTyped(data)` - Validate and convert from storage format
  - `toRepresentation(data)` - Validate and convert to storage format

### Code Generation

- `generateGo(schema, options)` - Generate Go code
- `generateRust(schema, options)` - Generate Rust code
- `generateTypeScript(schema, options)` - Generate TypeScript code

## License & Copyright

Copyright 2019-2025 Rod Vagg

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.