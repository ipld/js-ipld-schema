# Map Type Code Generation Tests

This file tests map type code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Basic map types
type StringMap {String : String}
type IntMap {String : Int}
type BytesMap {String : Bytes}
type LinkMap {String : Link}

# Map of custom type
type Person struct {
  name String
  age Int
}

type PersonDirectory {String : Person}

# Maps with nullable values
type OptionalStringMap {String : nullable String}
type OptionalPersonMap {String : nullable Person}

# Map used in struct
type Config struct {
  name String
  settings {String : String}
  metadata {String : Int}
  optionalData {String : nullable String}
}

# Complex example with custom types
type Status enum {
  | Active
  | Inactive
}

type Service struct {
  id Int
  status Status
}

type ServiceRegistry {String : Service}
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

import (
	"github.com/ipfs/go-cid"
)

type StringMap map[string]string

type IntMap map[string]int64

type BytesMap map[string][]byte

type LinkMap map[string]cid.Cid

type Person struct {
	name string
	age int64
}

type PersonDirectory map[string]Person

type OptionalStringMap map[string]*string

type OptionalPersonMap map[string]*Person

type Config struct {
	name string
	settings map[string]string
	metadata map[string]int64
	optionalData map[string]*string
}

type Status string

const (
	StatusActive Status = "Active"
	StatusInactive Status = "Inactive"
)

type Service struct {
	id int64
	status Status
}

type ServiceRegistry map[string]Service
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use cid::Cid;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type StringMap = HashMap<String, String>;

pub type IntMap = HashMap<String, i64>;

pub type BytesMap = HashMap<String, Vec<u8>>;

pub type LinkMap = HashMap<String, Cid>;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Person {
    pub name: String,
    pub age: i64,
}

pub type PersonDirectory = HashMap<String, Person>;

pub type OptionalStringMap = HashMap<String, Option<String>>;

pub type OptionalPersonMap = HashMap<String, Option<Person>>;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Config {
    pub name: String,
    pub settings: HashMap<String, String>,
    pub metadata: HashMap<String, i64>,
    #[serde(rename = "optionalData")]
    pub optional_data: HashMap<String, Option<String>>,
}

#[derive(Deserialize, Serialize)]
pub enum Status {
    Active,
    Inactive,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Service {
    pub id: i64,
    pub status: Status,
}

pub type ServiceRegistry = HashMap<String, Service>;
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
import {
  KindBytes,
  KindInt,
  KindLink,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type StringMap = { [key: string]: KindString }

export namespace StringMap {
  export function isStringMap(value: any): value is StringMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => KindString.isKindString(v))
  }
}

export type IntMap = { [key: string]: KindInt }

export namespace IntMap {
  export function isIntMap(value: any): value is IntMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => KindInt.isKindInt(v))
  }
}

export type BytesMap = { [key: string]: KindBytes }

export namespace BytesMap {
  export function isBytesMap(value: any): value is BytesMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => KindBytes.isKindBytes(v))
  }
}

export type LinkMap = { [key: string]: KindLink }

export namespace LinkMap {
  export function isLinkMap(value: any): value is LinkMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => KindLink.isKindLink(v))
  }
}

export type Person = {
  name: KindString
  age: KindInt
}

export namespace Person {
  export function isPerson(value: any): value is Person {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('name' in value && (KindString.isKindString(value.name))) &&
      ('age' in value && (KindInt.isKindInt(value.age)))
  }
}

export type PersonDirectory = { [key: string]: Person }

export namespace PersonDirectory {
  export function isPersonDirectory(value: any): value is PersonDirectory {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => Person.isPerson(v))
  }
}

export type OptionalStringMap = { [key: string]: KindString | null }

export namespace OptionalStringMap {
  export function isOptionalStringMap(value: any): value is OptionalStringMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => v === null || KindString.isKindString(v))
  }
}

export type OptionalPersonMap = { [key: string]: Person | null }

export namespace OptionalPersonMap {
  export function isOptionalPersonMap(value: any): value is OptionalPersonMap {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => v === null || Person.isPerson(v))
  }
}

export type Config = {
  name: KindString
  settings: { [key: string]: KindString }
  metadata: { [key: string]: KindInt }
  optionalData: { [key: string]: KindString | null }
}

export namespace Config {
  export function isConfig(value: any): value is Config {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 4 &&
      ('name' in value && (KindString.isKindString(value.name))) &&
      ('settings' in value && ((KindMap.isKindMap(value.settings) && Object.values(value.settings).every(v => KindString.isKindString(v))))) &&
      ('metadata' in value && ((KindMap.isKindMap(value.metadata) && Object.values(value.metadata).every(v => KindInt.isKindInt(v))))) &&
      ('optionalData' in value && ((KindMap.isKindMap(value.optionalData) && Object.values(value.optionalData).every(v => v === null || KindString.isKindString(v)))))
  }
}

export type Status = "Active" | "Inactive"

export namespace Status {
  export const Active: Status = "Active"
  export const Inactive: Status = "Inactive"
  
  export function isStatus(value: any): value is Status {
    return value === "Active" || value === "Inactive"
  }
}

export type Service = {
  id: KindInt
  status: Status
}

export namespace Service {
  export function isService(value: any): value is Service {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && (KindInt.isKindInt(value.id))) &&
      ('status' in value && (Status.isStatus(value.status)))
  }
}

export type ServiceRegistry = { [key: string]: Service }

export namespace ServiceRegistry {
  export function isServiceRegistry(value: any): value is ServiceRegistry {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => Service.isService(v))
  }
}
```