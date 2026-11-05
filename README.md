# Enygma Tree-Bound Nullifier Research

## Research question

Does Enygma consistently bind Poseidon-based nullifiers to the correct Merkle tree and leaf index across native Go code, Gnark circuits, client proof construction, proof handlers, and Solidity vault validation?

## Scope

This repository records source analysis and nine experiments conducted against the Enygma repository at commit a43586596644dd035ecd9e28ce6bc9022c1dec62.

The investigation covers native nullifier derivation, path-index range enforcement, Merkle tree rollover, client proof request construction, Groth16 handler verification, and Solidity root-history and vault validation.

## Principal findings

1. The native nullifier helper returned a hash for an out-of-range path index in the tested configuration. See EXP-NF-002.
2. The tested Gnark circuits rejected that out-of-range index under Groth16 and PLONK. See EXP-NF-001.
3. Native Merkle proof generation preserved the originating tree number after rollover. See EXP-NF-003.
4. Four client proof methods reproduced a mismatch between the caller-supplied tree number and the Merkle proof tree number. See EXP-NF-004 through EXP-NF-007.
5. Initiator and destination handlers verified real Groth16 proofs in controlled tests, demonstrating independent nullifier tree-number binding and Merkle path/root verification. See EXP-NF-008 and EXP-NF-009.
6. Solidity source uses tree-specific root-history validation and tree-scoped nullifier checks. See source-analysis/solidity-root-history.txt and source-analysis/solidity-vault-validation.txt.

## Security conclusion

The evidence establishes a reproducible client-side consistency gap and a separation between circuit-level nullifier verification and Merkle-root verification. The inspected Solidity source contains downstream tree-specific root validation. Runtime enforcement and exploitability have not been demonstrated. This investigation does not establish a confirmed double-spend vulnerability.
