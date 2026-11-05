ENYGMA NULLIFIER RESEARCH: REPRODUCTION GUIDE

Target commit: a43586596644dd035ecd9e28ce6bc9022c1dec62
Target repository: /workspaces/Enygma

EXP-NF-001: Circuit path-index range
cd /workspaces/Enygma/enygma_dvp/gnark_circuits
go test ./test/templates -run '^TestNullifierPathIndexOutOfRangeProbe$' -count=1 -v

EXP-NF-004: Initiator payload mismatch
cd /workspaces/Enygma/enygma_dvp/src/core
go test ./ -run '^TestNullifierTreeNumberPayloadMismatchProbe$' -count=1 -v

EXP-NF-005: Initiator from-salts payload mismatch
go test ./ -run '^TestNullifierTreeNumberFromSaltsPayloadMismatchProbe$' -count=1 -v

EXP-NF-006: ZK initiator payload mismatch
go test ./ -run '^TestNullifierTreeNumberZkInitiatorPayloadMismatchProbe$' -count=1 -v

EXP-NF-007: Destination payload mismatch
go test ./ -run '^TestNullifierTreeNumberDestinationPayloadMismatchProbe$' -count=1 -v

EXP-NF-008: Initiator real Groth16 handler test
cd /workspaces/Enygma/enygma_dvp/gnark_circuits
go test ./server/circuits/dvpInit -run '^TestHandler_TreeNumberAndMerkleRootIndependenceProbe$' -count=1 -v

EXP-NF-009: Destination real Groth16 handler test
go test ./server/circuits/dvpDestination -run '^TestHandler_TreeNumberAndMerkleRootIndependenceProbe$' -count=1 -v

Note: EXP-NF-002 and EXP-NF-003 used standalone native probes. Their original temporary test programs were removed.
Note: Client payload tests use mocked proof endpoints. Handler tests perform real Groth16 proof verification.
Note: Preserve the experimental modifications in the target repository before attempting reproduction.

WORKING-DIRECTORY NOTES

Run EXP-NF-004, EXP-NF-005, EXP-NF-006, and EXP-NF-007 from:
  /workspaces/Enygma/enygma_dvp/src/core

Run EXP-NF-008 and EXP-NF-009 from:
  /workspaces/Enygma/enygma_dvp/gnark_circuits

EXP-NF-001 is run from:
  /workspaces/Enygma/enygma_dvp/gnark_circuits

EXP-NF-002 and EXP-NF-003 are documented historical probes. Their
temporary source files were removed, so the original experiments cannot
be rerun using the commands in this guide.

PRESERVED EXPERIMENTAL FILES IN TARGET WORKING TREE

The following local experimental files support EXP-NF-004 through
EXP-NF-009. They are not part of the pinned target commit and must
remain preserved for reproduction:

  enygma_dvp/src/core/nullifier_tree_payload_probe_test.go
  enygma_dvp/gnark_circuits/server/circuits/dvpInit/handler_test.go
  enygma_dvp/gnark_circuits/server/circuits/dvpDestination/handler_test.go

These files are local working-tree additions or modifications in
/workspaces/Enygma. Do not reset, clean, restore, or delete them.
