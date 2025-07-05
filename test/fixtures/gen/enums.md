# Enum Type Code Generation Tests

This file tests enum type code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
type Status enum {
  | Pending
  | Active  
  | Completed
  | Failed
}

type Color enum {
  | Red ("r")
  | Green ("g")
  | Blue ("b")
  | Yellow
}

type ErrorCode enum {
  | Success ("0")
  | InvalidInput ("400")
  | Unauthorized ("401")
  | NotFound ("404")
  | ServerError ("500")
} representation int

# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredSealProof)
# @rusttype(fvm_shared::sector::RegisteredSealProof)
type RegisteredSealProof enum {
  | StackedDrg2KiBV1     ("0")
  | StackedDrg8MiBV1     ("1")
  | StackedDrg512MiBV1   ("2")
  | StackedDrg32GiBV1    ("3")
  | StackedDrg64GiBV1    ("4")
  | StackedDrg2KiBV1_1   ("5")
  | StackedDrg8MiBV1_1   ("6")
  | StackedDrg512MiBV1_1 ("7")
  | StackedDrg32GiBV1_1  ("8")
  | StackedDrg64GiBV1_1  ("9")
} representation int
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

import (
	"github.com/filecoin-project/go-state-types/abi"
)

type Status string

const (
	StatusPending Status = "Pending"
	StatusActive Status = "Active"
	StatusCompleted Status = "Completed"
	StatusFailed Status = "Failed"
)

type Color string

const (
	ColorRed Color = "r"
	ColorGreen Color = "g"
	ColorBlue Color = "b"
	ColorYellow Color = "Yellow"
)

type ErrorCode int64

const (
	ErrorCodeSuccess ErrorCode = 0
	ErrorCodeInvalidInput ErrorCode = 400
	ErrorCodeUnauthorized ErrorCode = 401
	ErrorCodeNotFound ErrorCode = 404
	ErrorCodeServerError ErrorCode = 500
)

type RegisteredSealProof = abi.RegisteredSealProof

const (
	RegisteredSealProofStackedDrg2KiBV1 RegisteredSealProof = 0
	RegisteredSealProofStackedDrg8MiBV1 RegisteredSealProof = 1
	RegisteredSealProofStackedDrg512MiBV1 RegisteredSealProof = 2
	RegisteredSealProofStackedDrg32GiBV1 RegisteredSealProof = 3
	RegisteredSealProofStackedDrg64GiBV1 RegisteredSealProof = 4
	RegisteredSealProofStackedDrg2KiBV1_1 RegisteredSealProof = 5
	RegisteredSealProofStackedDrg8MiBV1_1 RegisteredSealProof = 6
	RegisteredSealProofStackedDrg512MiBV1_1 RegisteredSealProof = 7
	RegisteredSealProofStackedDrg32GiBV1_1 RegisteredSealProof = 8
	RegisteredSealProofStackedDrg64GiBV1_1 RegisteredSealProof = 9
)
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use fvm_shared::sector::RegisteredSealProof;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub enum Status {
    Pending,
    Active,
    Completed,
    Failed,
}

#[derive(Deserialize, Serialize)]
pub enum Color {
    #[serde(rename = "r")]
    Red,
    #[serde(rename = "g")]
    Green,
    #[serde(rename = "b")]
    Blue,
    Yellow,
}

#[derive(Deserialize, Serialize)]
#[serde(repr = "int")]
pub enum ErrorCode {
    Success = 0,
    InvalidInput = 400,
    Unauthorized = 401,
    NotFound = 404,
    ServerError = 500,
}

pub type RegisteredSealProof = fvm_shared::sector::RegisteredSealProof;
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
export type Status = "Pending" | "Active" | "Completed" | "Failed"

export namespace Status {
  export const Pending: Status = "Pending"
  export const Active: Status = "Active"
  export const Completed: Status = "Completed"
  export const Failed: Status = "Failed"
  
  export function isStatus(value: any): value is Status {
    return value === "Pending" || value === "Active" || value === "Completed" || value === "Failed"
  }
}

export type Color = "r" | "g" | "b" | "Yellow"

export namespace Color {
  export const Red: Color = "r"
  export const Green: Color = "g"
  export const Blue: Color = "b"
  export const Yellow: Color = "Yellow"
  
  export function isColor(value: any): value is Color {
    return value === "r" || value === "g" || value === "b" || value === "Yellow"
  }
}

export type ErrorCode = 0 | 400 | 401 | 404 | 500

export namespace ErrorCode {
  export const Success: ErrorCode = 0
  export const InvalidInput: ErrorCode = 400
  export const Unauthorized: ErrorCode = 401
  export const NotFound: ErrorCode = 404
  export const ServerError: ErrorCode = 500
  
  export function isErrorCode(value: any): value is ErrorCode {
    return value === 0 || value === 400 || value === 401 || value === 404 || value === 500
  }
}

export type RegisteredSealProof = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export namespace RegisteredSealProof {
  export const StackedDrg2KiBV1: RegisteredSealProof = 0
  export const StackedDrg8MiBV1: RegisteredSealProof = 1
  export const StackedDrg512MiBV1: RegisteredSealProof = 2
  export const StackedDrg32GiBV1: RegisteredSealProof = 3
  export const StackedDrg64GiBV1: RegisteredSealProof = 4
  export const StackedDrg2KiBV1_1: RegisteredSealProof = 5
  export const StackedDrg8MiBV1_1: RegisteredSealProof = 6
  export const StackedDrg512MiBV1_1: RegisteredSealProof = 7
  export const StackedDrg32GiBV1_1: RegisteredSealProof = 8
  export const StackedDrg64GiBV1_1: RegisteredSealProof = 9
  
  export function isRegisteredSealProof(value: any): value is RegisteredSealProof {
    return value >= 0 && value <= 9 && Number.isInteger(value)
  }
}
```