# Filecoin miner state types

This file contains a set of Filecoin miner types to test code generation scenarios including @rustserde for bigint serialization, complex nested types, and various annotation features.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Basic numeric types from Filecoin
type ChainEpoch = Int
# @unsigned
# @gotype(github.com/filecoin-project/go-state-types/abi.SectorNumber)
type SectorNumber = Int
# @unsigned
# @gotype(github.com/filecoin-project/go-state-types/abi.DealID)
type DealID = Int
# @unsigned
type ActorID = Int
# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredSealProof)
type RegisteredSealProof = Int
# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredAggregationProof)
type RegisteredAggregateProof = Int
# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredPoStProof)
type RegisteredPoStProof = Int
# @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredUpdateProof)
type RegisteredUpdateProof = Int
# @unsigned
type SectorSize = Int

# BigInt types that need special serialization in Rust
# @gotypealias
# @gotype(github.com/filecoin-project/go-state-types/big.Int)
type TokenAmount = Int
# @gotypealias
# @gotype(github.com/filecoin-project/go-state-types/big.Int)
type StoragePower = Int
# @gotypealias
# @gotype(github.com/filecoin-project/go-state-types/big.Int)
type DealWeight = Int

# Special bytes types
type BitField = Bytes
type RawBytes = Bytes

# Flags type for SectorOnChainInfo
# @unsigned
type SectorOnChainInfoFlags = Int

# Simple key type for identifying partitions
type PartitionKey struct {
  # @unsigned
  Deadline Int
  # @unsigned
  Partition Int
} representation tuple

# Power pair represents raw and quality-adjusted power
type PowerPair struct {
  # @rustserde(with = "bigint_ser")
  Raw StoragePower
  # @rustserde(with = "bigint_ser")
  QA StoragePower
} representation tuple

# Pre-commit info for sectors
type SectorPreCommitInfo struct {
  SealProof RegisteredSealProof
  SectorNumber SectorNumber
  # CommR
  # @gotag(`checked:"true"`)
  SealedCID Link
  SealRandEpoch ChainEpoch
  # @rustrename(deal_ids)
  DealIDs [DealID]
  Expiration ChainEpoch
  # CommD - nullable in Go, CompactCommD in Rust
  # @rustrename(unsealed_cid)
  UnsealedCid optional Link
} representation tuple

# Set of sectors expiring at a given epoch
type ExpirationSet struct {
  # Sectors expiring "on time" at the end of their committed life
  # @gotype(github.com/filecoin-project/go-bitfield.BitField)
  # @rusttype(fvm_ipld_bitfield::BitField)
  OnTimeSectors BitField
  # Sectors expiring "early" due to being faulty for too long
  # @gotype(github.com/filecoin-project/go-bitfield.BitField)
  # @rusttype(fvm_ipld_bitfield::BitField)
  EarlySectors BitField
  # Pledge total for the on-time sectors
  # @rustserde(with = "bigint_ser")
  OnTimePledge TokenAmount
  # Power that is currently active (not faulty)
  ActivePower PowerPair
  # Power that is currently faulty
  FaultyPower PowerPair
  # Adjustment to the daily fee
  # @rustserde(with = "bigint_ser")
  # @rustserde(default)
  FeeDeduction optional TokenAmount
} representation tuple

# Information about a sector on chain
type SectorOnChainInfo struct {
  SectorNumber SectorNumber
  # The seal proof type implies the PoSt proofs
  SealProof RegisteredSealProof
  # CommR
  # @gotag(`checked:"true"`)
  SealedCID Link
  # Deprecated but retained for cbor decoding
  # @gorename(DeprecatedDealIDs)
  # @gotag(`json:"-"`)
  # @rustrename(deprecated_deal_ids)
  DeprecatedDealIDs [DealID]
  # Epoch during which the sector proof was accepted
  Activation ChainEpoch
  # Epoch during which the sector expires
  Expiration ChainEpoch
  # Integral of active deals over sector lifetime
  # @rustserde(with = "bigint_ser")
  DealWeight DealWeight
  # Integral of active verified deals over sector lifetime
  # @rustserde(with = "bigint_ser")
  VerifiedDealWeight DealWeight
  # Pledge collected to commit this sector
  # @rustserde(with = "bigint_ser")
  InitialPledge TokenAmount
  # Epoch at which this sector's power was most recently updated
  PowerBaseEpoch ChainEpoch
  # Additional flags
  Flags SectorOnChainInfoFlags
  # Expected one day projection of reward for sector (deprecated)
  # @rustserde(with = "bigint_ser")
  ExpectedDayReward optional TokenAmount
  # Expected twenty day projection of reward for sector (deprecated)
  # @rustserde(with = "bigint_ser")
  ExpectedStoragePledge optional TokenAmount
  # Day reward of this sector before its power was most recently updated (deprecated)
  # @rustserde(with = "bigint_ser")
  ReplacedDayReward optional TokenAmount
  # The original SealedSectorCID, only set on first ReplicaUpdate
  SectorKeyCID optional Link
  # The total fee payable per day for this sector
  # @rustserde(with = "bigint_ser")
  # @rustserde(default)
  # @gotag(`cborgen:"optional"`)
  DailyFee optional TokenAmount
} representation tuple

# Nested structures
type VerifiedAllocationKey struct {
  Client ActorID
  ID Int
} representation tuple

type PieceActivationManifest struct {
  # @gotag(`checked:"true"`)
  CID Link
  # @unsigned
  Size Int
  VerifiedAllocationKey optional VerifiedAllocationKey
} representation tuple

type SectorActivationManifest struct {
  SectorNumber SectorNumber
  Pieces [PieceActivationManifest]
} representation tuple

type ProveCommitSectors3Params struct {
  SectorActivations [SectorActivationManifest]
  SectorProofs [RawBytes]
  AggregateProof RawBytes
  RequireActivationSuccess Bool
  RequireNotificationSuccess Bool
  # @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredAggregationProof)
  # @rusttype(fvm_shared::sector::RegisteredAggregateProof)
  AggregateProofType optional RegisteredAggregateProof
} representation tuple

# Recovery and fault declaration types
type RecoveryDeclaration struct {
  # The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
  # @unsigned
  Deadline Int
  # Partition index within the deadline containing the recovered sectors.
  # @unsigned
  Partition Int
  # Sectors in the partition being declared recovered.
  # @gotype(github.com/filecoin-project/go-bitfield.BitField)
  # @rusttype(fvm_ipld_bitfield::BitField)
  Sectors BitField
} representation tuple

type DeclareFaultsRecoveredParams struct {
  Recoveries [RecoveryDeclaration]
} representation tuple

type FaultDeclaration struct {
  # The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
  # @unsigned
  Deadline Int
  # Partition index within the deadline containing the faulty sectors.
  # @unsigned
  Partition Int
  # Sectors in the partition being declared faulty.
  # @gotype(github.com/filecoin-project/go-bitfield.BitField)
  # @rusttype(fvm_ipld_bitfield::BitField)
  Sectors BitField
} representation tuple

type DeclareFaultsParams struct {
  Faults [FaultDeclaration]
} representation tuple

# Replica update type
# @rustderive(Debug, Clone, PartialEq, Eq)
type ReplicaUpdate struct {
  # @gotype(github.com/filecoin-project/go-state-types/abi.SectorNumber)
  # @gorename(SectorID)
  # @rusttype(fvm_shared::sector::SectorNumber)
  SectorNumber Int
  # @unsigned
  Deadline Int
  # @unsigned
  Partition Int
  # @gotag(`checked:"true"`)
  # @rustrename(new_sealed_cid)
  NewSealedSectorCID Link
  # @gotype(github.com/filecoin-project/go-state-types/abi.DealID)
  # @rusttype(fvm_shared::deal::DealID)
  Deals [DealID]
  # @gotype(github.com/filecoin-project/go-state-types/abi.RegisteredUpdateProof)
  # @rusttype(fvm_shared::sector::RegisteredUpdateProof)
  UpdateProofType RegisteredUpdateProof
  # @rusttype(fvm_ipld_encoding::RawBytes)
  ReplicaProof RawBytes
} representation tuple
```

## Expected Go output

[testmark]:# (test/golang)
```go
package testpkg

import (
	"github.com/filecoin-project/go-bitfield"
	"github.com/filecoin-project/go-state-types/abi"
	"github.com/filecoin-project/go-state-types/big"
	"github.com/ipfs/go-cid"
)

type ChainEpoch int64

type SectorNumber abi.SectorNumber

type DealID abi.DealID

type ActorID uint64

type RegisteredSealProof abi.RegisteredSealProof

type RegisteredAggregateProof abi.RegisteredAggregationProof

type RegisteredPoStProof abi.RegisteredPoStProof

type RegisteredUpdateProof abi.RegisteredUpdateProof

type SectorSize uint64

type TokenAmount = big.Int

type StoragePower = big.Int

type DealWeight = big.Int

type BitField []byte

type RawBytes []byte

type SectorOnChainInfoFlags uint64

type PartitionKey struct {
	Deadline uint64
	Partition uint64
}

type PowerPair struct {
	Raw StoragePower
	QA StoragePower
}

type SectorPreCommitInfo struct {
	SealProof RegisteredSealProof
	SectorNumber SectorNumber
	// CommR
	SealedCID cid.Cid `checked:"true"`
	SealRandEpoch ChainEpoch
	DealIDs []DealID
	Expiration ChainEpoch
	// CommD - nullable in Go, CompactCommD in Rust
	UnsealedCid *cid.Cid
}

type ExpirationSet struct {
	// Sectors expiring "on time" at the end of their committed life
	OnTimeSectors bitfield.BitField
	// Sectors expiring "early" due to being faulty for too long
	EarlySectors bitfield.BitField
	// Pledge total for the on-time sectors
	OnTimePledge TokenAmount
	// Power that is currently active (not faulty)
	ActivePower PowerPair
	// Power that is currently faulty
	FaultyPower PowerPair
	// Adjustment to the daily fee
	FeeDeduction *TokenAmount
}

type SectorOnChainInfo struct {
	SectorNumber SectorNumber
	// The seal proof type implies the PoSt proofs
	SealProof RegisteredSealProof
	// CommR
	SealedCID cid.Cid `checked:"true"`
	// Deprecated but retained for cbor decoding
	DeprecatedDealIDs []DealID `json:"-"` // Epoch during which the sector proof was accepted
	Activation ChainEpoch
	// Epoch during which the sector expires
	Expiration ChainEpoch
	// Integral of active deals over sector lifetime
	DealWeight DealWeight
	// Integral of active verified deals over sector lifetime
	VerifiedDealWeight DealWeight
	// Pledge collected to commit this sector
	InitialPledge TokenAmount
	// Epoch at which this sector's power was most recently updated
	PowerBaseEpoch ChainEpoch
	// Additional flags
	Flags SectorOnChainInfoFlags
	// Expected one day projection of reward for sector (deprecated)
	ExpectedDayReward *TokenAmount
	// Expected twenty day projection of reward for sector (deprecated)
	ExpectedStoragePledge *TokenAmount
	// Day reward of this sector before its power was most recently updated (deprecated)
	ReplacedDayReward *TokenAmount
	// The original SealedSectorCID, only set on first ReplicaUpdate
	SectorKeyCID *cid.Cid
	// The total fee payable per day for this sector
	DailyFee *TokenAmount `cborgen:"optional"`
}

type VerifiedAllocationKey struct {
	Client ActorID
	ID int64
}

type PieceActivationManifest struct {
	CID cid.Cid `checked:"true"`
	Size uint64
	VerifiedAllocationKey *VerifiedAllocationKey
}

type SectorActivationManifest struct {
	SectorNumber SectorNumber
	Pieces []PieceActivationManifest
}

type ProveCommitSectors3Params struct {
	SectorActivations []SectorActivationManifest
	SectorProofs []RawBytes
	AggregateProof RawBytes
	RequireActivationSuccess bool
	RequireNotificationSuccess bool
	AggregateProofType *abi.RegisteredAggregationProof
}

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
	ReplicaProof RawBytes
}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use cid::Cid;
use fvm_ipld_bitfield::BitField;
use fvm_ipld_encoding::RawBytes;
use fvm_shared::deal::DealID;
use fvm_shared::sector::{RegisteredAggregateProof, RegisteredUpdateProof, SectorNumber};
use serde::{Deserialize, Serialize};
use serde_tuple::{Deserialize_tuple, Serialize_tuple};

pub type ChainEpoch = i64;

pub type SectorNumber = u64;

pub type DealID = u64;

pub type ActorID = u64;

pub type RegisteredSealProof = i64;

pub type RegisteredAggregateProof = i64;

pub type RegisteredPoStProof = i64;

pub type RegisteredUpdateProof = i64;

pub type SectorSize = u64;

pub type TokenAmount = i64;

pub type StoragePower = i64;

pub type DealWeight = i64;

pub type BitField = Vec<u8>;

pub type RawBytes = Vec<u8>;

pub type SectorOnChainInfoFlags = u64;

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct PartitionKey {
    pub deadline: u64,
    pub partition: u64,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct PowerPair {
    #[serde(with = "bigint_ser")]
    pub raw: StoragePower,
    #[serde(with = "bigint_ser")]
    pub qa: StoragePower,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct SectorPreCommitInfo {
    pub seal_proof: RegisteredSealProof,
    pub sector_number: SectorNumber,
    /// CommR
    pub sealed_cid: Cid,
    pub seal_rand_epoch: ChainEpoch,
    pub deal_ids: Vec<DealID>,
    pub expiration: ChainEpoch,
    /// CommD - nullable in Go, CompactCommD in Rust
    #[serde(default)]
    pub unsealed_cid: Option<Cid>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct ExpirationSet {
    /// Sectors expiring "on time" at the end of their committed life
    pub on_time_sectors: BitField,
    /// Sectors expiring "early" due to being faulty for too long
    pub early_sectors: BitField,
    /// Pledge total for the on-time sectors
    #[serde(with = "bigint_ser")]
    pub on_time_pledge: TokenAmount,
    /// Power that is currently active (not faulty)
    pub active_power: PowerPair,
    /// Power that is currently faulty
    pub faulty_power: PowerPair,
    /// Adjustment to the daily fee
    #[serde(with = "bigint_ser", default)]
    pub fee_deduction: Option<TokenAmount>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct SectorOnChainInfo {
    pub sector_number: SectorNumber,
    /// The seal proof type implies the PoSt proofs
    pub seal_proof: RegisteredSealProof,
    /// CommR
    pub sealed_cid: Cid,
    /// Deprecated but retained for cbor decoding
    pub deprecated_deal_ids: Vec<DealID>, // Epoch during which the sector proof was accepted
    pub activation: ChainEpoch,
    /// Epoch during which the sector expires
    pub expiration: ChainEpoch,
    /// Integral of active deals over sector lifetime
    #[serde(with = "bigint_ser")]
    pub deal_weight: DealWeight,
    /// Integral of active verified deals over sector lifetime
    #[serde(with = "bigint_ser")]
    pub verified_deal_weight: DealWeight,
    /// Pledge collected to commit this sector
    #[serde(with = "bigint_ser")]
    pub initial_pledge: TokenAmount,
    /// Epoch at which this sector's power was most recently updated
    pub power_base_epoch: ChainEpoch,
    /// Additional flags
    pub flags: SectorOnChainInfoFlags,
    /// Expected one day projection of reward for sector (deprecated)
    #[serde(with = "bigint_ser", default)]
    pub expected_day_reward: Option<TokenAmount>,
    /// Expected twenty day projection of reward for sector (deprecated)
    #[serde(with = "bigint_ser", default)]
    pub expected_storage_pledge: Option<TokenAmount>,
    /// Day reward of this sector before its power was most recently updated (deprecated)
    #[serde(with = "bigint_ser", default)]
    pub replaced_day_reward: Option<TokenAmount>,
    /// The original SealedSectorCID, only set on first ReplicaUpdate
    #[serde(default)]
    pub sector_key_cid: Option<Cid>,
    /// The total fee payable per day for this sector
    #[serde(with = "bigint_ser", default)]
    pub daily_fee: Option<TokenAmount>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct VerifiedAllocationKey {
    pub client: ActorID,
    pub id: i64,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct PieceActivationManifest {
    pub cid: Cid,
    pub size: u64,
    #[serde(default)]
    pub verified_allocation_key: Option<VerifiedAllocationKey>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct SectorActivationManifest {
    pub sector_number: SectorNumber,
    pub pieces: Vec<PieceActivationManifest>,
}

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct ProveCommitSectors3Params {
    pub sector_activations: Vec<SectorActivationManifest>,
    pub sector_proofs: Vec<RawBytes>,
    pub aggregate_proof: RawBytes,
    pub require_activation_success: bool,
    pub require_notification_success: bool,
    #[serde(default)]
    pub aggregate_proof_type: Option<RegisteredAggregateProof>,
}

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

[testmark]:# (test/typescript)
```typescript
import {
  KindBool,
  KindBytes,
  KindInt,
  KindLink,
  KindMap,
} from '@ipld/schema/schema-schema.js'

export type ChainEpoch = KindInt

export namespace ChainEpoch {
  export function isChainEpoch(value: any): value is ChainEpoch {
    return KindInt.isKindInt(value)
  }
}

export type SectorNumber = KindInt

export namespace SectorNumber {
  export function isSectorNumber(value: any): value is SectorNumber {
    return KindInt.isKindInt(value)
  }
}

export type DealID = KindInt

export namespace DealID {
  export function isDealID(value: any): value is DealID {
    return KindInt.isKindInt(value)
  }
}

export type ActorID = KindInt

export namespace ActorID {
  export function isActorID(value: any): value is ActorID {
    return KindInt.isKindInt(value)
  }
}

export type RegisteredSealProof = KindInt

export namespace RegisteredSealProof {
  export function isRegisteredSealProof(value: any): value is RegisteredSealProof {
    return KindInt.isKindInt(value)
  }
}

export type RegisteredAggregateProof = KindInt

export namespace RegisteredAggregateProof {
  export function isRegisteredAggregateProof(value: any): value is RegisteredAggregateProof {
    return KindInt.isKindInt(value)
  }
}

export type RegisteredPoStProof = KindInt

export namespace RegisteredPoStProof {
  export function isRegisteredPoStProof(value: any): value is RegisteredPoStProof {
    return KindInt.isKindInt(value)
  }
}

export type RegisteredUpdateProof = KindInt

export namespace RegisteredUpdateProof {
  export function isRegisteredUpdateProof(value: any): value is RegisteredUpdateProof {
    return KindInt.isKindInt(value)
  }
}

export type SectorSize = KindInt

export namespace SectorSize {
  export function isSectorSize(value: any): value is SectorSize {
    return KindInt.isKindInt(value)
  }
}

export type TokenAmount = KindInt

export namespace TokenAmount {
  export function isTokenAmount(value: any): value is TokenAmount {
    return KindInt.isKindInt(value)
  }
}

export type StoragePower = KindInt

export namespace StoragePower {
  export function isStoragePower(value: any): value is StoragePower {
    return KindInt.isKindInt(value)
  }
}

export type DealWeight = KindInt

export namespace DealWeight {
  export function isDealWeight(value: any): value is DealWeight {
    return KindInt.isKindInt(value)
  }
}

export type BitField = KindBytes

export namespace BitField {
  export function isBitField(value: any): value is BitField {
    return KindBytes.isKindBytes(value)
  }
}

export type RawBytes = KindBytes

export namespace RawBytes {
  export function isRawBytes(value: any): value is RawBytes {
    return KindBytes.isKindBytes(value)
  }
}

export type SectorOnChainInfoFlags = KindInt

export namespace SectorOnChainInfoFlags {
  export function isSectorOnChainInfoFlags(value: any): value is SectorOnChainInfoFlags {
    return KindInt.isKindInt(value)
  }
}

export type PartitionKey = {
  Deadline: KindInt
  Partition: KindInt
}

export namespace PartitionKey {
  export function isPartitionKey(value: any): value is PartitionKey {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('Deadline' in value && (KindInt.isKindInt(value.Deadline))) &&
      ('Partition' in value && (KindInt.isKindInt(value.Partition)))
  }
}

export type PowerPair = {
  Raw: StoragePower
  QA: StoragePower
}

export namespace PowerPair {
  export function isPowerPair(value: any): value is PowerPair {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('Raw' in value && (StoragePower.isStoragePower(value.Raw))) &&
      ('QA' in value && (StoragePower.isStoragePower(value.QA)))
  }
}

export type SectorPreCommitInfo = {
  SealProof: RegisteredSealProof
  SectorNumber: SectorNumber
  // CommR
  SealedCID: KindLink
  SealRandEpoch: ChainEpoch
  DealIDs: DealID[]
  Expiration: ChainEpoch
  // CommD - nullable in Go, CompactCommD in Rust
  UnsealedCid?: KindLink
}

export namespace SectorPreCommitInfo {
  export function isSectorPreCommitInfo(value: any): value is SectorPreCommitInfo {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 6 && keyCount <= 7 &&
      ('SealProof' in value && (RegisteredSealProof.isRegisteredSealProof(value.SealProof))) &&
      ('SectorNumber' in value && (SectorNumber.isSectorNumber(value.SectorNumber))) &&
      ('SealedCID' in value && (KindLink.isKindLink(value.SealedCID))) &&
      ('SealRandEpoch' in value && (ChainEpoch.isChainEpoch(value.SealRandEpoch))) &&
      ('DealIDs' in value && ((Array.isArray(value.DealIDs) && value.DealIDs.every(DealID.isDealID)))) &&
      ('Expiration' in value && (ChainEpoch.isChainEpoch(value.Expiration))) &&
      (!('UnsealedCid' in value) || (KindLink.isKindLink(value.UnsealedCid)))
  }
}

export type ExpirationSet = {
  // Sectors expiring "on time" at the end of their committed life
  OnTimeSectors: BitField
  // Sectors expiring "early" due to being faulty for too long
  EarlySectors: BitField
  // Pledge total for the on-time sectors
  OnTimePledge: TokenAmount
  // Power that is currently active (not faulty)
  ActivePower: PowerPair
  // Power that is currently faulty
  FaultyPower: PowerPair
  // Adjustment to the daily fee
  FeeDeduction?: TokenAmount
}

export namespace ExpirationSet {
  export function isExpirationSet(value: any): value is ExpirationSet {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 5 && keyCount <= 6 &&
      ('OnTimeSectors' in value && (BitField.isBitField(value.OnTimeSectors))) &&
      ('EarlySectors' in value && (BitField.isBitField(value.EarlySectors))) &&
      ('OnTimePledge' in value && (TokenAmount.isTokenAmount(value.OnTimePledge))) &&
      ('ActivePower' in value && (PowerPair.isPowerPair(value.ActivePower))) &&
      ('FaultyPower' in value && (PowerPair.isPowerPair(value.FaultyPower))) &&
      (!('FeeDeduction' in value) || (TokenAmount.isTokenAmount(value.FeeDeduction)))
  }
}

export type SectorOnChainInfo = {
  SectorNumber: SectorNumber
  // The seal proof type implies the PoSt proofs
  SealProof: RegisteredSealProof
  // CommR
  SealedCID: KindLink
  // Deprecated but retained for cbor decoding
  DeprecatedDealIDs: DealID[] // Epoch during which the sector proof was accepted
  Activation: ChainEpoch
  // Epoch during which the sector expires
  Expiration: ChainEpoch
  // Integral of active deals over sector lifetime
  DealWeight: DealWeight
  // Integral of active verified deals over sector lifetime
  VerifiedDealWeight: DealWeight
  // Pledge collected to commit this sector
  InitialPledge: TokenAmount
  // Epoch at which this sector's power was most recently updated
  PowerBaseEpoch: ChainEpoch
  // Additional flags
  Flags: SectorOnChainInfoFlags
  // Expected one day projection of reward for sector (deprecated)
  ExpectedDayReward?: TokenAmount
  // Expected twenty day projection of reward for sector (deprecated)
  ExpectedStoragePledge?: TokenAmount
  // Day reward of this sector before its power was most recently updated (deprecated)
  ReplacedDayReward?: TokenAmount
  // The original SealedSectorCID, only set on first ReplicaUpdate
  SectorKeyCID?: KindLink
  // The total fee payable per day for this sector
  DailyFee?: TokenAmount
}

export namespace SectorOnChainInfo {
  export function isSectorOnChainInfo(value: any): value is SectorOnChainInfo {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 11 && keyCount <= 16 &&
      ('SectorNumber' in value && (SectorNumber.isSectorNumber(value.SectorNumber))) &&
      ('SealProof' in value && (RegisteredSealProof.isRegisteredSealProof(value.SealProof))) &&
      ('SealedCID' in value && (KindLink.isKindLink(value.SealedCID))) &&
      ('DeprecatedDealIDs' in value && ((Array.isArray(value.DeprecatedDealIDs) && value.DeprecatedDealIDs.every(DealID.isDealID)))) &&
      ('Activation' in value && (ChainEpoch.isChainEpoch(value.Activation))) &&
      ('Expiration' in value && (ChainEpoch.isChainEpoch(value.Expiration))) &&
      ('DealWeight' in value && (DealWeight.isDealWeight(value.DealWeight))) &&
      ('VerifiedDealWeight' in value && (DealWeight.isDealWeight(value.VerifiedDealWeight))) &&
      ('InitialPledge' in value && (TokenAmount.isTokenAmount(value.InitialPledge))) &&
      ('PowerBaseEpoch' in value && (ChainEpoch.isChainEpoch(value.PowerBaseEpoch))) &&
      ('Flags' in value && (SectorOnChainInfoFlags.isSectorOnChainInfoFlags(value.Flags))) &&
      (!('ExpectedDayReward' in value) || (TokenAmount.isTokenAmount(value.ExpectedDayReward))) &&
      (!('ExpectedStoragePledge' in value) || (TokenAmount.isTokenAmount(value.ExpectedStoragePledge))) &&
      (!('ReplacedDayReward' in value) || (TokenAmount.isTokenAmount(value.ReplacedDayReward))) &&
      (!('SectorKeyCID' in value) || (KindLink.isKindLink(value.SectorKeyCID))) &&
      (!('DailyFee' in value) || (TokenAmount.isTokenAmount(value.DailyFee)))
  }
}

export type VerifiedAllocationKey = {
  Client: ActorID
  ID: KindInt
}

export namespace VerifiedAllocationKey {
  export function isVerifiedAllocationKey(value: any): value is VerifiedAllocationKey {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('Client' in value && (ActorID.isActorID(value.Client))) &&
      ('ID' in value && (KindInt.isKindInt(value.ID)))
  }
}

export type PieceActivationManifest = {
  CID: KindLink
  Size: KindInt
  VerifiedAllocationKey?: VerifiedAllocationKey
}

export namespace PieceActivationManifest {
  export function isPieceActivationManifest(value: any): value is PieceActivationManifest {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 3 &&
      ('CID' in value && (KindLink.isKindLink(value.CID))) &&
      ('Size' in value && (KindInt.isKindInt(value.Size))) &&
      (!('VerifiedAllocationKey' in value) || (VerifiedAllocationKey.isVerifiedAllocationKey(value.VerifiedAllocationKey)))
  }
}

export type SectorActivationManifest = {
  SectorNumber: SectorNumber
  Pieces: PieceActivationManifest[]
}

export namespace SectorActivationManifest {
  export function isSectorActivationManifest(value: any): value is SectorActivationManifest {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('SectorNumber' in value && (SectorNumber.isSectorNumber(value.SectorNumber))) &&
      ('Pieces' in value && ((Array.isArray(value.Pieces) && value.Pieces.every(PieceActivationManifest.isPieceActivationManifest))))
  }
}

export type ProveCommitSectors3Params = {
  SectorActivations: SectorActivationManifest[]
  SectorProofs: RawBytes[]
  AggregateProof: RawBytes
  RequireActivationSuccess: KindBool
  RequireNotificationSuccess: KindBool
  AggregateProofType?: RegisteredAggregateProof
}

export namespace ProveCommitSectors3Params {
  export function isProveCommitSectors3Params(value: any): value is ProveCommitSectors3Params {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 5 && keyCount <= 6 &&
      ('SectorActivations' in value && ((Array.isArray(value.SectorActivations) && value.SectorActivations.every(SectorActivationManifest.isSectorActivationManifest)))) &&
      ('SectorProofs' in value && ((Array.isArray(value.SectorProofs) && value.SectorProofs.every(RawBytes.isRawBytes)))) &&
      ('AggregateProof' in value && (RawBytes.isRawBytes(value.AggregateProof))) &&
      ('RequireActivationSuccess' in value && (KindBool.isKindBool(value.RequireActivationSuccess))) &&
      ('RequireNotificationSuccess' in value && (KindBool.isKindBool(value.RequireNotificationSuccess))) &&
      (!('AggregateProofType' in value) || (RegisteredAggregateProof.isRegisteredAggregateProof(value.AggregateProofType)))
  }
}

export type RecoveryDeclaration = {
  // The deadline to which the recovered sectors are assigned, in range [0..WPoStPeriodDeadlines)
  Deadline: KindInt
  // Partition index within the deadline containing the recovered sectors.
  Partition: KindInt
  // Sectors in the partition being declared recovered.
  Sectors: BitField
}

export namespace RecoveryDeclaration {
  export function isRecoveryDeclaration(value: any): value is RecoveryDeclaration {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 3 &&
      ('Deadline' in value && (KindInt.isKindInt(value.Deadline))) &&
      ('Partition' in value && (KindInt.isKindInt(value.Partition))) &&
      ('Sectors' in value && (BitField.isBitField(value.Sectors)))
  }
}

export type DeclareFaultsRecoveredParams = {
  Recoveries: RecoveryDeclaration[]
}

export namespace DeclareFaultsRecoveredParams {
  export function isDeclareFaultsRecoveredParams(value: any): value is DeclareFaultsRecoveredParams {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 1 &&
      ('Recoveries' in value && ((Array.isArray(value.Recoveries) && value.Recoveries.every(RecoveryDeclaration.isRecoveryDeclaration))))
  }
}

export type FaultDeclaration = {
  // The deadline to which the faulty sectors are assigned, in range [0..WPoStPeriodDeadlines)
  Deadline: KindInt
  // Partition index within the deadline containing the faulty sectors.
  Partition: KindInt
  // Sectors in the partition being declared faulty.
  Sectors: BitField
}

export namespace FaultDeclaration {
  export function isFaultDeclaration(value: any): value is FaultDeclaration {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 3 &&
      ('Deadline' in value && (KindInt.isKindInt(value.Deadline))) &&
      ('Partition' in value && (KindInt.isKindInt(value.Partition))) &&
      ('Sectors' in value && (BitField.isBitField(value.Sectors)))
  }
}

export type DeclareFaultsParams = {
  Faults: FaultDeclaration[]
}

export namespace DeclareFaultsParams {
  export function isDeclareFaultsParams(value: any): value is DeclareFaultsParams {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 1 &&
      ('Faults' in value && ((Array.isArray(value.Faults) && value.Faults.every(FaultDeclaration.isFaultDeclaration))))
  }
}

export type ReplicaUpdate = {
  SectorNumber: KindInt
  Deadline: KindInt
  Partition: KindInt
  NewSealedSectorCID: KindLink
  Deals: DealID[]
  UpdateProofType: RegisteredUpdateProof
  ReplicaProof: RawBytes
}

export namespace ReplicaUpdate {
  export function isReplicaUpdate(value: any): value is ReplicaUpdate {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 7 &&
      ('SectorNumber' in value && (KindInt.isKindInt(value.SectorNumber))) &&
      ('Deadline' in value && (KindInt.isKindInt(value.Deadline))) &&
      ('Partition' in value && (KindInt.isKindInt(value.Partition))) &&
      ('NewSealedSectorCID' in value && (KindLink.isKindLink(value.NewSealedSectorCID))) &&
      ('Deals' in value && ((Array.isArray(value.Deals) && value.Deals.every(DealID.isDealID)))) &&
      ('UpdateProofType' in value && (RegisteredUpdateProof.isRegisteredUpdateProof(value.UpdateProofType))) &&
      ('ReplicaProof' in value && (RawBytes.isRawBytes(value.ReplicaProof)))
  }
}
```