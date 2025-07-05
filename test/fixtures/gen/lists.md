# List Type Code Generation Tests

This file tests list type code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Basic list types
type Numbers [Int]
type Names [String]
type Addresses [Bytes]
type Links [Link]

# List of custom type
type Person struct {
  name String
  age Int
}

type People [Person]

# Lists with nullable elements
type OptionalNumbers [nullable Int]
type OptionalPeople [nullable Person]

# TODO: Nested lists support coming later
# type Matrix [[Int]]
# type GroupsOfPeople [[Person]]

# List used in struct
type Team struct {
  name String
  members [Person]
  scores [Int]
  optionalTags [nullable String]
}

# Complex example with imports needed
type Status enum {
  | Active
  | Inactive
}

type Record struct {
  id Int
  status Status
}

type Records [Record]
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

import (
	"github.com/ipfs/go-cid"
)

type Numbers []int64

type Names []string

type Addresses [][]byte

type Links []cid.Cid

type Person struct {
	name string
	age int64
}

type People []Person

type OptionalNumbers []*int64

type OptionalPeople []*Person

type Team struct {
	name string
	members []Person
	scores []int64
	optionalTags []*string
}

type Status string

const (
	StatusActive Status = "Active"
	StatusInactive Status = "Inactive"
)

type Record struct {
	id int64
	status Status
}

type Records []Record
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use cid::Cid;
use serde::{Deserialize, Serialize};

pub type Numbers = Vec<i64>;

pub type Names = Vec<String>;

pub type Addresses = Vec<Vec<u8>>;

pub type Links = Vec<Cid>;

#[derive(Deserialize, Serialize)]
pub struct Person {
    pub name: String,
    pub age: i64,
}

pub type People = Vec<Person>;

pub type OptionalNumbers = Vec<Option<i64>>;

pub type OptionalPeople = Vec<Option<Person>>;

#[derive(Deserialize, Serialize)]
pub struct Team {
    pub name: String,
    pub members: Vec<Person>,
    pub scores: Vec<i64>,
    pub optional_tags: Vec<Option<String>>,
}

#[derive(Deserialize, Serialize)]
pub enum Status {
    Active,
    Inactive,
}

#[derive(Deserialize, Serialize)]
pub struct Record {
    pub id: i64,
    pub status: Status,
}

pub type Records = Vec<Record>;
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

export type Numbers = KindInt[]

export namespace Numbers {
  export function isNumbers(value: any): value is Numbers {
    return Array.isArray(value) && value.every(KindInt.isKindInt)
  }
}

export type Names = KindString[]

export namespace Names {
  export function isNames(value: any): value is Names {
    return Array.isArray(value) && value.every(KindString.isKindString)
  }
}

export type Addresses = KindBytes[]

export namespace Addresses {
  export function isAddresses(value: any): value is Addresses {
    return Array.isArray(value) && value.every(KindBytes.isKindBytes)
  }
}

export type Links = KindLink[]

export namespace Links {
  export function isLinks(value: any): value is Links {
    return Array.isArray(value) && value.every(KindLink.isKindLink)
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
      ('name' in value && ((KindString.isKindString(value.name)))) &&
      ('age' in value && ((KindInt.isKindInt(value.age))))
  }
}

export type People = Person[]

export namespace People {
  export function isPeople(value: any): value is People {
    return Array.isArray(value) && value.every(Person.isPerson)
  }
}

export type OptionalNumbers = (KindInt | null)[]

export namespace OptionalNumbers {
  export function isOptionalNumbers(value: any): value is OptionalNumbers {
    return Array.isArray(value) && value.every(v => v === null || KindInt.isKindInt(v))
  }
}

export type OptionalPeople = (Person | null)[]

export namespace OptionalPeople {
  export function isOptionalPeople(value: any): value is OptionalPeople {
    return Array.isArray(value) && value.every(v => v === null || Person.isPerson(v))
  }
}

export type Team = {
  name: KindString
  members: Person[]
  scores: KindInt[]
  optionalTags: (KindString | null)[]
}

export namespace Team {
  export function isTeam(value: any): value is Team {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 4 &&
      ('name' in value && ((KindString.isKindString(value.name)))) &&
      ('members' in value && ((Array.isArray(value.members) && value.members.every(Person.isPerson)))) &&
      ('scores' in value && ((Array.isArray(value.scores) && value.scores.every(KindInt.isKindInt)))) &&
      ('optionalTags' in value && ((Array.isArray(value.optionalTags) && value.optionalTags.every(v => v === null || KindString.isKindString(v)))))
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

export type Record = {
  id: KindInt
  status: Status
}

export namespace Record {
  export function isRecord(value: any): value is Record {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && ((KindInt.isKindInt(value.id)))) &&
      ('status' in value && ((Status.isStatus(value.status))))
  }
}

export type Records = Record[]

export namespace Records {
  export function isRecords(value: any): value is Records {
    return Array.isArray(value) && value.every(Record.isRecord)
  }
}
```