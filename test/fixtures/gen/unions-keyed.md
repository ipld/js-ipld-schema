# Keyed Union Type Code Generation Tests

This file tests keyed union type code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Basic keyed union
type SimpleResult union {
  | Success "success"
  | Error "error"
} representation keyed

type Success struct {
  value String
  code Int
}

type Error struct {
  message String
  code Int
}

# More complex keyed union with multiple types
type ProveCommitResult union {
  | ProveCommitSectors3Return "sectors3"
  | ProveCommitAggregateReturn "aggregate"
} representation keyed

type ProveCommitSectors3Return struct {
  results [PoStProof]
}

type ProveCommitAggregateReturn struct {
  aggregateProof Bytes
  sectorNumbers [Int]
}

type PoStProof struct {
  postProof Int
  proofBytes Bytes
}

# Union used in a struct
type Transaction struct {
  id String
  timestamp Int
  result SimpleResult
}

# Nested union scenario
type OperationResult union {
  | CreateResult "create"
  | UpdateResult "update"
  | DeleteResult "delete"
} representation keyed

type CreateResult struct {
  id String
  resource SimpleResult
}

type UpdateResult struct {
  id String
  changes Int
}

type DeleteResult struct {
  id String
  confirmed Bool
}
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

type SimpleResult interface {
	simpleResult()
}

type Success struct {
	value string
	code int64
}

func (Success) simpleResult() {}

type Error struct {
	message string
	code int64
}

func (Error) simpleResult() {}

type ProveCommitResult interface {
	proveCommitResult()
}

type ProveCommitSectors3Return struct {
	results []PoStProof
}

func (ProveCommitSectors3Return) proveCommitResult() {}

type ProveCommitAggregateReturn struct {
	aggregateProof []byte
	sectorNumbers []int64
}

func (ProveCommitAggregateReturn) proveCommitResult() {}

type PoStProof struct {
	postProof int64
	proofBytes []byte
}

type Transaction struct {
	id string
	timestamp int64
	result SimpleResult
}

type OperationResult interface {
	operationResult()
}

type CreateResult struct {
	id string
	resource SimpleResult
}

func (CreateResult) operationResult() {}

type UpdateResult struct {
	id string
	changes int64
}

func (UpdateResult) operationResult() {}

type DeleteResult struct {
	id string
	confirmed bool
}

func (DeleteResult) operationResult() {}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum SimpleResult {
    #[serde(rename = "success")]
    Success(Success),
    #[serde(rename = "error")]
    Error(Error),
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Success {
    pub value: String,
    pub code: i64,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Error {
    pub message: String,
    pub code: i64,
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum ProveCommitResult {
    #[serde(rename = "sectors3")]
    ProveCommitSectors3Return(ProveCommitSectors3Return),
    #[serde(rename = "aggregate")]
    ProveCommitAggregateReturn(ProveCommitAggregateReturn),
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ProveCommitSectors3Return {
    pub results: Vec<PoStProof>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ProveCommitAggregateReturn {
    #[serde(rename = "aggregateProof")]
    pub aggregate_proof: Vec<u8>,
    #[serde(rename = "sectorNumbers")]
    pub sector_numbers: Vec<i64>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct PoStProof {
    #[serde(rename = "postProof")]
    pub post_proof: i64,
    #[serde(rename = "proofBytes")]
    pub proof_bytes: Vec<u8>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Transaction {
    pub id: String,
    pub timestamp: i64,
    pub result: SimpleResult,
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum OperationResult {
    #[serde(rename = "create")]
    CreateResult(CreateResult),
    #[serde(rename = "update")]
    UpdateResult(UpdateResult),
    #[serde(rename = "delete")]
    DeleteResult(DeleteResult),
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct CreateResult {
    pub id: String,
    pub resource: SimpleResult,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct UpdateResult {
    pub id: String,
    pub changes: i64,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct DeleteResult {
    pub id: String,
    pub confirmed: bool,
}
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
import {
  KindBool,
  KindBytes,
  KindInt,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type SimpleResult = { success: Success } | { error: Error }

export namespace SimpleResult {
  export function isSimpleResult(value: any): value is SimpleResult {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    const keys = Object.keys(value)
    if (keys.length !== 1) {
      return false
    }
    if ('success' in value) {
      return Success.isSuccess(value.success)
    }
    if ('error' in value) {
      return Error.isError(value.error)
    }
    return false
  }
}

export type Success = {
  value: KindString
  code: KindInt
}

export namespace Success {
  export function isSuccess(value: any): value is Success {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('value' in value && (KindString.isKindString(value.value))) &&
      ('code' in value && (KindInt.isKindInt(value.code)))
  }
}

export type Error = {
  message: KindString
  code: KindInt
}

export namespace Error {
  export function isError(value: any): value is Error {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('message' in value && (KindString.isKindString(value.message))) &&
      ('code' in value && (KindInt.isKindInt(value.code)))
  }
}

export type ProveCommitResult = { sectors3: ProveCommitSectors3Return } | { aggregate: ProveCommitAggregateReturn }

export namespace ProveCommitResult {
  export function isProveCommitResult(value: any): value is ProveCommitResult {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    const keys = Object.keys(value)
    if (keys.length !== 1) {
      return false
    }
    if ('sectors3' in value) {
      return ProveCommitSectors3Return.isProveCommitSectors3Return(value.sectors3)
    }
    if ('aggregate' in value) {
      return ProveCommitAggregateReturn.isProveCommitAggregateReturn(value.aggregate)
    }
    return false
  }
}

export type ProveCommitSectors3Return = {
  results: PoStProof[]
}

export namespace ProveCommitSectors3Return {
  export function isProveCommitSectors3Return(value: any): value is ProveCommitSectors3Return {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 1 &&
      ('results' in value && ((Array.isArray(value.results) && value.results.every(PoStProof.isPoStProof))))
  }
}

export type ProveCommitAggregateReturn = {
  aggregateProof: KindBytes
  sectorNumbers: KindInt[]
}

export namespace ProveCommitAggregateReturn {
  export function isProveCommitAggregateReturn(value: any): value is ProveCommitAggregateReturn {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('aggregateProof' in value && (KindBytes.isKindBytes(value.aggregateProof))) &&
      ('sectorNumbers' in value && ((Array.isArray(value.sectorNumbers) && value.sectorNumbers.every(KindInt.isKindInt))))
  }
}

export type PoStProof = {
  postProof: KindInt
  proofBytes: KindBytes
}

export namespace PoStProof {
  export function isPoStProof(value: any): value is PoStProof {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('postProof' in value && (KindInt.isKindInt(value.postProof))) &&
      ('proofBytes' in value && (KindBytes.isKindBytes(value.proofBytes)))
  }
}

export type Transaction = {
  id: KindString
  timestamp: KindInt
  result: SimpleResult
}

export namespace Transaction {
  export function isTransaction(value: any): value is Transaction {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 3 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('timestamp' in value && (KindInt.isKindInt(value.timestamp))) &&
      ('result' in value && (SimpleResult.isSimpleResult(value.result)))
  }
}

export type OperationResult = { create: CreateResult } | { update: UpdateResult } | { delete: DeleteResult }

export namespace OperationResult {
  export function isOperationResult(value: any): value is OperationResult {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    const keys = Object.keys(value)
    if (keys.length !== 1) {
      return false
    }
    if ('create' in value) {
      return CreateResult.isCreateResult(value.create)
    }
    if ('update' in value) {
      return UpdateResult.isUpdateResult(value.update)
    }
    if ('delete' in value) {
      return DeleteResult.isDeleteResult(value.delete)
    }
    return false
  }
}

export type CreateResult = {
  id: KindString
  resource: SimpleResult
}

export namespace CreateResult {
  export function isCreateResult(value: any): value is CreateResult {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('resource' in value && (SimpleResult.isSimpleResult(value.resource)))
  }
}

export type UpdateResult = {
  id: KindString
  changes: KindInt
}

export namespace UpdateResult {
  export function isUpdateResult(value: any): value is UpdateResult {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('changes' in value && (KindInt.isKindInt(value.changes)))
  }
}

export type DeleteResult = {
  id: KindString
  confirmed: KindBool
}

export namespace DeleteResult {
  export function isDeleteResult(value: any): value is DeleteResult {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('confirmed' in value && (KindBool.isKindBool(value.confirmed)))
  }
}
```