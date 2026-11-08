# Enygma Tree-Bound Nullifier Research

## Research question

Does Enygma consistently bind Poseidon-based nullifiers to the correct
Merkle tree and leaf index across native Go code, Gnark circuits, client
proof construction, proof handlers, and Solidity vault validation?

## Scope

This repository records source analysis and fourteen experiment records conducted
against the Enygma repository at commit:

`a43586596644dd035ecd9e28ce6bc9022c1dec62`

The investigation covers native nullifier derivation, path-index range
enforcement, Merkle tree rollover, client proof construction, Groth16
handler verification, demo rollover reachability, Solidity vault and
DvP settlement logic, four Solidity runtime test executions
(including a separate production-Poseidon root-history confirmation),
and one real rollover client-to-initiator-handler integration experiment.

## Principal findings

1. The native nullifier helper returned a hash for the tested out-of-range
   path index. See EXP-NF-002.
2. The tested Gnark circuits rejected that out-of-range index under
   Groth16 and PLONK. See EXP-NF-001.
3. Native Merkle proof generation preserved the originating tree number
   after rollover. See EXP-NF-003.
4. Four client proof methods reproduced a mismatch between the
   caller-supplied tree number and the Merkle proof tree number.
   See EXP-NF-004 through EXP-NF-007.
5. Initiator and destination handlers verified real Groth16 proofs.
   The tests demonstrated nullifier binding to the supplied tree number
   and independent Merkle path/root verification.
   See EXP-NF-008 and EXP-NF-009.
6. Demo source inspection identified a path to a mismatched proof request
   after rollover: historical commitment events are replayed into a
   Merkle tree, while the demo separately supplies literal tree number
   zero to the initiator and destination proof methods.
7. Solidity source uses tree-specific root-history validation and
   tree-scoped nullifier checks.
8. The inspected DvP flow stores and locks the first receipt, retrieves
   and unlocks it for the matching second leg, revalidates both receipts,
   nullifies both inputs, and then inserts output commitments.
9. Asset-group membership has a separate tree-zero root check, but
   registered-vault membership is an alternative condition.
10. A Solidity runtime test confirmed tree-specific root-history lookup
    after rollover in the inherited Merkle implementation using mock
    Poseidon. See EXP-NF-010.
11. A separate runtime test repeated the root-history isolation test
    using generated production Poseidon libraries and independently
    matched the on-chain Poseidon output against circomlibjs.
    See EXP-NF-010B.
12. A Solidity runtime test confirmed separate tree-scoped nullifier
    storage. See EXP-NF-011.
13. A production vault runtime test confirmed that nullifyFromReceipt
    selects the nullifier namespace using the receipt tree number.
    The test used a placeholder root and zero proof coordinates.
    See EXP-NF-012.
14. A real rollover integration test passed the same tree-1 proof
    through the client method and initiator handler with supplied
    tree numbers 1 and 0. See EXP-NF-013.

## Security conclusion

The evidence establishes a reproducible client-side tree-number
consistency gap and a separation between circuit-level nullifier
verification and Merkle-root/path verification.

The demo findings establish source-level reachability, not a live
post-rollover proof request. Solidity runtime tests demonstrate
tree-specific root-history lookup in the inherited Merkle implementation
using both mock and generated production Poseidon libraries, tree-scoped
nullifier storage, and production vault receipt nullifier tree selection.
The production receipt test used a placeholder root
and zero proof coordinates. EXP-NF-013 demonstrates the mismatch at
the local client-to-initiator-handler boundary, but complete production
vault proof validation and end-to-end mismatched-tree settlement remain
untested.

No successful exploitation, double-spending, unauthorized asset
movement, or invalid on-chain settlement has been demonstrated.
This investigation does not establish a confirmed double-spend
vulnerability.

## Research records

- `docs/final-report.txt` - consolidated technical findings.
- `docs/research-scope.txt` - research question and evidence boundary.
- `docs/security-assessment.txt` - security classification and limitations.
- `evidence/experiment-register.txt` - experiment index.
- `evidence/runtime-logs/` - preserved runtime outputs and commands.
- `evidence/source/` - preserved experiment source snapshot.
- `experiments/` - experiment records.
- `source-analysis/` - source-level analysis and call-path findings.
