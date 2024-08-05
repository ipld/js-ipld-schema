# Filecoin miner state types

This file is an input to a test case, using the [testmark](https://github.com/warpfork/go-testmark) format. The IPLD Schema presented should be transform through the `generate*` functions to the code blocks that follow.

* [Schema](#schema)
* [Expected Go output](#expected-go-output)
* [Expected Rust output](#expected-rust-output)
* [Expected TypeScript output](#expected-typescript-output)

## Schema

[testmark]:# (test/schema)
```ipldsch
type RecoveryDeclaration struct {
	# The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
	#
	# @unsigned
	Deadline Int

	# Partition index within the deadline containing the recovered sectors.
	#
	# @unsigned
	Partition Int

	# Sectors in the partition being declared recovered.
	#
	# @gotype(github.com/filecoin-project/go-bitfield.BitField)
	# @rusttype(fvm_ipld_bitfield::BitField)
	Sectors Bytes
} representation tuple

type DeclareFaultsRecoveredParams struct {
	Recoveries [RecoveryDeclaration]
} representation tuple

type FaultDeclaration struct {
	# The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
	#
	# @unsigned
	Deadline Int

	# Partition index within the deadline containing the faulty sectors.
	#
	# @unsigned
	Partition Int

	# Sectors in the partition being declared faulty.
	#
	# @gotype(github.com/filecoin-project/go-bitfield.BitField)
	# @rusttype(fvm_ipld_bitfield::BitField)
	Sectors Bytes
} representation tuple

type DeclareFaultsParams struct {
	Faults [FaultDeclaration]
} representation tuple

# @rustderive(Debug, Clone, PartialEq, Eq)
type ReplicaUpdate struct {
	# @gotype(github.com/filecoin-project/go-state-types/abi.SectorNumber)
	# @gorename(SectorID) - for historical reasons
	# @rusttype(fvm_shared::sector::SectorNumber)
	SectorNumber       Int
	# @unsigned
	Deadline           Int
	# @unsigned
	Partition          Int
	# @gotag(`checked:"true"`)
	# @rustrename(new_sealed_cid)
	NewSealedSectorCID Link
	# @gotype(github.com/filecoin-project/go-state-types/abi.DealID)
	# @rusttype(fvm_shared::deal::DealID)
	Deals              [Int]
	# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredUpdateProof)
	# @rusttype(fvm_shared::sector::RegisteredUpdateProof)
	UpdateProofType    Int
	# @rusttype(fvm_ipld_encoding::RawBytes)
	ReplicaProof       Bytes
} representation tuple
```

## Expected Go output

[testmark]:# (test/golang)
```go
package testpkg

import (
	"github.com/filecoin-project/go-bitfield"
	"github.com/filecoin-project/go-state-types/abi"
	"github.com/ipfs/go-cid"
)

type RecoveryDeclaration struct {
	// The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
	Deadline uint64
	// Partition index within the deadline containing the recovered sectors.
	Partition uint64
	// Sectors in the partition being declared recovered.
	Sectors bitfield.BitField
}

type DeclareFaultsRecoveredParams struct {
	Recoveries []RecoveryDeclaration
}

type FaultDeclaration struct {
	// The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
	Deadline uint64
	// Partition index within the deadline containing the faulty sectors.
	Partition uint64
	// Sectors in the partition being declared faulty.
	Sectors bitfield.BitField
}

type DeclareFaultsParams struct {
	Faults []FaultDeclaration
}

type ReplicaUpdate struct {
	SectorID abi.SectorNumber
	Deadline uint64
	Partition uint64
	NewSealedSectorCID cid.Cid `checked:"true"`
	Deals []abi.DealID
	UpdateProofType abi.RegisteredUpdateProof
	ReplicaProof []byte
}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use cid::Cid;
use fvm_ipld_bitfield::BitField;
use fvm_ipld_encoding::RawBytes;
use fvm_shared::deal::DealID;
use fvm_shared::sector::{RegisteredUpdateProof, SectorNumber};
use serde::{Deserialize, Serialize};
use serde_tuple::{Deserialize_tuple, Serialize_tuple};

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct RecoveryDeclaration {
    /// The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
    pub deadline: u64,
    /// Partition index within the deadline containing the recovered sectors.
    pub partition: u64,
    /// Sectors in the partition being declared recovered.
    pub sectors: BitField,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct DeclareFaultsRecoveredParams {
    pub recoveries: Vec<RecoveryDeclaration>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct FaultDeclaration {
    /// The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
    pub deadline: u64,
    /// Partition index within the deadline containing the faulty sectors.
    pub partition: u64,
    /// Sectors in the partition being declared faulty.
    pub sectors: BitField,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct DeclareFaultsParams {
    pub faults: Vec<FaultDeclaration>,
}

#[derive(Clone, Debug, Deserialize_tuple, Eq, PartialEq, Serialize_tuple)]
pub struct ReplicaUpdate {
    pub sector_number: SectorNumber,
    pub deadline: u64,
    pub partition: u64,
    pub new_sealed_cid: Cid,
    pub deals: Vec<DealID>,
    pub update_proof_type: RegisteredUpdateProof,
    pub replica_proof: RawBytes,
}
```

## Expected TypeScript output

This is rough, I'm not a TypeScript expert and this is mostly a guess. It should probably import schema-schema.ts from this package and use those types as a foundation since they contain the IPLD datamodel kinds and type kinds.

[testmark]:# (test/typescript)
```typescript
import { CID } from 'multiformats/cid'

export type RecoveryDeclaration = {
  // The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
  deadline: number
  // Partition index within the deadline containing the recovered sectors.
  partition: number
  // Sectors in the partition being declared recovered.
  sectors: Uint8Array
}

export type DeclareFaultsRecoveredParams = {
  recoveries: RecoveryDeclaration[]
}

export type FaultDeclaration = {
  // The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
  deadline: number
  // Partition index within the deadline containing the faulty sectors.
  partition: number
  // Sectors in the partition being declared faulty.
  sectors: Uint8Array
}

export type DeclareFaultsParams = {
  faults: FaultDeclaration[]
}

export type ReplicaUpdate = {
  sectorNumber: number
  deadline: number
  partition: number
  newSealedSectorCID: CID
  deals: number[]
  updateProofType: number
  replicaProof: Uint8Array
}
```