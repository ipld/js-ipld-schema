# Optional Fields Code Generation Tests

This file tests optional field code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Struct with optional fields in map representation
type User struct {
  id String
  name String
  email optional String
  age optional Int
  verified Bool
}

# Struct with nullable and optional fields
type Profile struct {
  userId String
  bio optional nullable String
  avatar optional String
  lastLogin nullable Int
}

# Struct with optional fields at end for tuple representation
type TupleData struct {
  required1 String
  required2 Int
  optional1 optional String
  optional2 optional Bool
} representation tuple
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

type User struct {
	id string
	name string
	email *string
	age *int64
	verified bool
}

type Profile struct {
	userId string
	bio *string
	avatar *string
	lastLogin *int64
}

type TupleData struct {
	required1 string
	required2 int64
	optional1 *string
	optional2 *bool
}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};
use serde_tuple::{Deserialize_tuple, Serialize_tuple};

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct User {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age: Option<i64>,
    pub verified: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Profile {
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(rename = "lastLogin")]
    pub last_login: Option<i64>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct TupleData {
    pub required1: String,
    pub required2: i64,
    #[serde(default)]
    pub optional1: Option<String>,
    #[serde(default)]
    pub optional2: Option<bool>,
}
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
import {
  KindBool,
  KindInt,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type User = {
  id: KindString
  name: KindString
  email?: KindString
  age?: KindInt
  verified: KindBool
}

export namespace User {
  export function isUser(value: any): value is User {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 3 && keyCount <= 5 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('name' in value && (KindString.isKindString(value.name))) &&
      (!('email' in value) || (KindString.isKindString(value.email))) &&
      (!('age' in value) || (KindInt.isKindInt(value.age))) &&
      ('verified' in value && (KindBool.isKindBool(value.verified)))
  }
}

export type Profile = {
  userId: KindString
  bio?: KindString | null
  avatar?: KindString
  lastLogin: KindInt | null
}

export namespace Profile {
  export function isProfile(value: any): value is Profile {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 4 &&
      ('userId' in value && (KindString.isKindString(value.userId))) &&
      (!('bio' in value) || (value.bio === null || KindString.isKindString(value.bio))) &&
      (!('avatar' in value) || (KindString.isKindString(value.avatar))) &&
      ('lastLogin' in value && (value.lastLogin === null || KindInt.isKindInt(value.lastLogin)))
  }
}

export type TupleData = {
  required1: KindString
  required2: KindInt
  optional1?: KindString
  optional2?: KindBool
}

export namespace TupleData {
  export function isTupleData(value: any): value is TupleData {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 4 &&
      ('required1' in value && (KindString.isKindString(value.required1))) &&
      ('required2' in value && (KindInt.isKindInt(value.required2))) &&
      (!('optional1' in value) || (KindString.isKindString(value.optional1))) &&
      (!('optional2' in value) || (KindBool.isKindBool(value.optional2)))
  }
}
```