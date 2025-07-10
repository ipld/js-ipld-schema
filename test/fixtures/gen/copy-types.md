# Copy Types (Type Aliases)

Testing copy type generation for Go, Rust, and TypeScript.

[testmark]:# (test/schema)
```ipldsch
# Basic copy types
type UserID = String
type Age = Int
type Balance = Float
type Data = Bytes
type Reference = Link

# Copy of struct
type Person struct {
  name String
  age Int
}

type Employee = Person

# Copy of enum
type Status enum {
  | Active
  | Inactive
  | Pending
} representation string

type UserStatus = Status

# Copy of list
type Names [String]
type TeamMembers = Names

# Copy of map
type Settings {String: String}
type Configuration = Settings

# Chained copies
type ID = String
type UserIdentifier = ID
type AdminID = UserIdentifier

# Copy with annotations (annotations should not carry over)
# @rusttype(custom::Type)
type SpecialInt = Int

type RegularInt = SpecialInt
```

[testmark]:# (test/golang)
```go
package main

import (
	"github.com/ipfs/go-cid"
)

type UserID string

type Age int64

type Balance float64

type Data []byte

type Reference cid.Cid

type Person struct {
	name string
	age int64
}

type Employee Person

type Status string

const (
	StatusActive Status = "Active"
	StatusInactive Status = "Inactive"
	StatusPending Status = "Pending"
)

type UserStatus Status

type Names []string

type TeamMembers Names

type Settings map[string]string

type Configuration Settings

type ID string

type UserIdentifier ID

type AdminID UserIdentifier

type SpecialInt int64

type RegularInt SpecialInt
```

[testmark]:# (test/rust)
```rust
use cid::Cid;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type UserID = String;

pub type Age = i64;

pub type Balance = f64;

pub type Data = Vec<u8>;

pub type Reference = Cid;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Person {
    pub name: String,
    pub age: i64,
}

pub type Employee = Person;

#[derive(Deserialize, Serialize)]
pub enum Status {
    Active,
    Inactive,
    Pending,
}

pub type UserStatus = Status;

pub type Names = Vec<String>;

pub type TeamMembers = Names;

pub type Settings = HashMap<String, String>;

pub type Configuration = Settings;

pub type ID = String;

pub type UserIdentifier = ID;

pub type AdminID = UserIdentifier;

pub type SpecialInt = i64;

pub type RegularInt = SpecialInt;
```

[testmark]:# (test/typescript)
```typescript
import {
  KindBytes,
  KindFloat,
  KindInt,
  KindLink,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type UserID = KindString

export namespace UserID {
  export function isUserID(value: any): value is UserID {
    return KindString.isKindString(value)
  }
}

export type Age = KindInt

export namespace Age {
  export function isAge(value: any): value is Age {
    return KindInt.isKindInt(value)
  }
}

export type Balance = KindFloat

export namespace Balance {
  export function isBalance(value: any): value is Balance {
    return KindFloat.isKindFloat(value)
  }
}

export type Data = KindBytes

export namespace Data {
  export function isData(value: any): value is Data {
    return KindBytes.isKindBytes(value)
  }
}

export type Reference = KindLink

export namespace Reference {
  export function isReference(value: any): value is Reference {
    return KindLink.isKindLink(value)
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

export type Employee = Person

export namespace Employee {
  export function isEmployee(value: any): value is Employee {
    return Person.isPerson(value)
  }
}

export type Status = "Active" | "Inactive" | "Pending"

export namespace Status {
  export const Active: Status = "Active"
  export const Inactive: Status = "Inactive"
  export const Pending: Status = "Pending"

  export function isStatus(value: any): value is Status {
    return value === "Active" || value === "Inactive" || value === "Pending"
  }
}

export type UserStatus = Status

export namespace UserStatus {
  export function isUserStatus(value: any): value is UserStatus {
    return Status.isStatus(value)
  }
}

export type Names = KindString[]

export namespace Names {
  export function isNames(value: any): value is Names {
    return Array.isArray(value) && value.every(KindString.isKindString)
  }
}

export type TeamMembers = Names

export namespace TeamMembers {
  export function isTeamMembers(value: any): value is TeamMembers {
    return Names.isNames(value)
  }
}

export type Settings = { [key: string]: KindString }

export namespace Settings {
  export function isSettings(value: any): value is Settings {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    return Object.values(value).every(v => KindString.isKindString(v))
  }
}

export type Configuration = Settings

export namespace Configuration {
  export function isConfiguration(value: any): value is Configuration {
    return Settings.isSettings(value)
  }
}

export type ID = KindString

export namespace ID {
  export function isID(value: any): value is ID {
    return KindString.isKindString(value)
  }
}

export type UserIdentifier = ID

export namespace UserIdentifier {
  export function isUserIdentifier(value: any): value is UserIdentifier {
    return ID.isID(value)
  }
}

export type AdminID = UserIdentifier

export namespace AdminID {
  export function isAdminID(value: any): value is AdminID {
    return UserIdentifier.isUserIdentifier(value)
  }
}

export type SpecialInt = KindInt

export namespace SpecialInt {
  export function isSpecialInt(value: any): value is SpecialInt {
    return KindInt.isKindInt(value)
  }
}

export type RegularInt = SpecialInt

export namespace RegularInt {
  export function isRegularInt(value: any): value is RegularInt {
    return SpecialInt.isSpecialInt(value)
  }
}
```