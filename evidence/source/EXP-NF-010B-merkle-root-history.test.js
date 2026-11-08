const assert = require("assert");
const { ethers } = require("hardhat");

describe("Merkle root history: tree isolation after rollover", function () {
  it("accepts each root only under its originating tree number", async function () {
    const MockPoseidon = await ethers.getContractFactory(
      "RuntimeMockPoseidon"
    );
    const mockPoseidon = await MockPoseidon.deploy();
    await mockPoseidon.deployed();

    const MerkleHarness = await ethers.getContractFactory(
      "MerkleRootHistoryHarness"
    );
    const merkle = await MerkleHarness.deploy();
    await merkle.deployed();

    await (
      await merkle.initializeForTest(2, mockPoseidon.address)
    ).wait();

    const initialRoot = await merkle.currentRoot();

    await (
      await merkle.insertLeavesForTest([101, 102, 103])
    ).wait();

    const tree0Root = await merkle.currentRoot();
    const tree0Number = await merkle.treeNumber();

    await (
      await merkle.insertLeavesForTest([104])
    ).wait();

    const tree1Root = await merkle.currentRoot();
    const tree1Number = await merkle.treeNumber();

    console.log("Initial root:", initialRoot.toString());
    console.log("Tree 0 root:", tree0Root.toString());
    console.log("Tree 1 root:", tree1Root.toString());
    console.log("Tree number after first insertion:", tree0Number.toString());
    console.log("Tree number after rollover:", tree1Number.toString());

    assert.strictEqual(tree0Number.toString(), "0");
    assert.strictEqual(tree1Number.toString(), "1");

    assert.strictEqual(
      await merkle.isValidRoot(0, tree0Root),
      true,
      "Tree 0 should recognize its own root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(1, tree1Root),
      true,
      "Tree 1 should recognize its own root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(0, tree1Root),
      false,
      "Tree 0 must not recognize tree 1's root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(1, tree0Root),
      false,
      "Tree 1 must not recognize tree 0's root"
    );
  });
});


describe("Merkle nullifier storage: tree isolation", function () {
  it("stores the same nullifier independently under different tree numbers", async function () {
    const MockPoseidon = await ethers.getContractFactory(
      "RuntimeMockPoseidon"
    );
    const mockPoseidon = await MockPoseidon.deploy();
    await mockPoseidon.deployed();

    const MerkleHarness = await ethers.getContractFactory(
      "MerkleRootHistoryHarness"
    );
    const merkle = await MerkleHarness.deploy();
    await merkle.deployed();

    await (
      await merkle.initializeForTest(2, mockPoseidon.address)
    ).wait();

    const nullifier = 777;

    await (
      await merkle.spendNullifierForTest(0, nullifier)
    ).wait();

    assert.strictEqual(
      await merkle.isSpentForTest(0, nullifier),
      true,
      "Tree 0 should recognize its spent nullifier"
    );

    assert.strictEqual(
      await merkle.isSpentForTest(1, nullifier),
      false,
      "Tree 1 should not recognize tree 0's spent nullifier"
    );

    await (
      await merkle.spendNullifierForTest(1, nullifier)
    ).wait();

    assert.strictEqual(
      await merkle.isSpentForTest(0, nullifier),
      true,
      "Tree 0 should retain its spent state"
    );

    assert.strictEqual(
      await merkle.isSpentForTest(1, nullifier),
      true,
      "Tree 1 should independently record the same nullifier"
    );

    console.log("Tested nullifier:", nullifier);
    console.log(
      "Tree 0 spent state:",
      await merkle.isSpentForTest(0, nullifier)
    );
    console.log(
      "Tree 1 spent state:",
      await merkle.isSpentForTest(1, nullifier)
    );
  });
});

describe("Vault receipt processing: tree-scoped nullifiers", function () {
  it("records a receipt nullifier under the tree number supplied in its statement", async function () {
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();

    const MockPoseidon = await ethers.getContractFactory(
      "RuntimeMockPoseidon"
    );
    const mockPoseidon = await MockPoseidon.deploy();
    await mockPoseidon.deployed();

    const Vault = await ethers.getContractFactory(
      "EnygmaErc20CoinVault"
    );
    const vault = await Vault.deploy(signerAddress);
    await vault.deployed();

    await (
      await vault.initializeVault(
        1,
        1,
        ethers.constants.AddressZero,
        2,
        mockPoseidon.address,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero
      )
    ).wait();

    const nullifier = 777;
    const nonzeroPlaceholderRoot = 12345;

    function makeReceipt(receiptTreeNumber) {
      const proof = [
        [0, 0],
        [[0, 0], [0, 0]],
        [0, 0]
      ];

      const statement = [
        0,
        receiptTreeNumber,
        nonzeroPlaceholderRoot,
        nullifier
      ];

      return [proof, statement, 1, 0];
    }

    // Process a receipt identifying tree 1.
    await (
      await vault.nullifyFromReceipt(makeReceipt(1))
    ).wait();

    assert.strictEqual(
      await vault.isValidNullifier(1, nullifier),
      true,
      "The receipt nullifier should be recorded under tree 1"
    );

    assert.strictEqual(
      await vault.isValidNullifier(0, nullifier),
      false,
      "Processing a tree 1 receipt should not spend the nullifier under tree 0"
    );

    // Process another receipt with the same nullifier, this time identifying tree 0.
    await (
      await vault.nullifyFromReceipt(makeReceipt(0))
    ).wait();

    assert.strictEqual(
      await vault.isValidNullifier(0, nullifier),
      true,
      "The second receipt should record the same nullifier independently under tree 0"
    );

    assert.strictEqual(
      await vault.isValidNullifier(1, nullifier),
      true,
      "Tree 1's previously recorded nullifier should remain spent"
    );

    console.log("Receipt nullifier:", nullifier);
    console.log("Tree 0 spent state:", await vault.isValidNullifier(0, nullifier));
    console.log("Tree 1 spent state:", await vault.isValidNullifier(1, nullifier));
  });
});

describe("Production Poseidon: Merkle root-history isolation", function () {
  it("isolates roots after rollover using the generated production Poseidon libraries", async function () {
    const { buildPoseidon } = require("circomlibjs");

    const [deployer] = await ethers.getSigners();

    const poseidonT3Artifact = require(
      "../artifacts/contracts/core/contracts/Poseidon.sol/PoseidonT3.json"
    );
    const poseidonT3 = await new ethers.ContractFactory(
      poseidonT3Artifact.abi,
      poseidonT3Artifact.bytecode,
      deployer
    ).deploy();
    await poseidonT3.deployed();

    const poseidonT5Artifact = require(
      "../artifacts/contracts/core/contracts/Poseidon.sol/PoseidonT5.json"
    );
    const poseidonT5 = await new ethers.ContractFactory(
      poseidonT5Artifact.abi,
      poseidonT5Artifact.bytecode,
      deployer
    ).deploy();
    await poseidonT5.deployed();

    const PoseidonWrapper = await ethers.getContractFactory(
      "PoseidonWrapper",
      {
        libraries: {
          PoseidonT3: poseidonT3.address,
          PoseidonT5: poseidonT5.address,
        },
      }
    );

    const wrapper = await PoseidonWrapper.deploy();
    await wrapper.deployed();

    // Independently verify that the deployed wrapper uses real Poseidon.
    const input = [123, 456];
    const onChainHash = await wrapper.poseidon(input);

    const poseidon = await buildPoseidon();
    const expectedHash = poseidon.F.toString(
      poseidon(input.map(BigInt))
    );

    assert.strictEqual(
      onChainHash.toString(),
      expectedHash,
      "Production wrapper output must match circomlibjs Poseidon"
    );

    const MerkleHarness = await ethers.getContractFactory(
      "MerkleRootHistoryHarness"
    );
    const merkle = await MerkleHarness.deploy();
    await merkle.deployed();

    await (
      await merkle.initializeForTest(2, wrapper.address)
    ).wait();

    const initialRoot = await merkle.currentRoot();

    await (
      await merkle.insertLeavesForTest([101, 102, 103])
    ).wait();

    const tree0Root = await merkle.currentRoot();
    const tree0Number = await merkle.treeNumber();

    await (
      await merkle.insertLeavesForTest([104])
    ).wait();

    const tree1Root = await merkle.currentRoot();
    const tree1Number = await merkle.treeNumber();

    console.log("PoseidonT3 address:", poseidonT3.address);
    console.log("PoseidonT5 address:", poseidonT5.address);
    console.log("PoseidonWrapper address:", wrapper.address);
    console.log("Poseidon cross-check input:", input.join(", "));
    console.log("Poseidon on-chain hash:", onChainHash.toString());
    console.log("Poseidon circomlibjs hash:", expectedHash);
    console.log("Initial root:", initialRoot.toString());
    console.log("Tree 0 root:", tree0Root.toString());
    console.log("Tree 1 root:", tree1Root.toString());
    console.log("Tree number after first insertion:", tree0Number.toString());
    console.log("Tree number after rollover:", tree1Number.toString());

    assert.strictEqual(tree0Number.toString(), "0");
    assert.strictEqual(tree1Number.toString(), "1");

    assert.strictEqual(
      await merkle.isValidRoot(0, tree0Root),
      true,
      "Tree 0 should recognize its own root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(1, tree1Root),
      true,
      "Tree 1 should recognize its own root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(0, tree1Root),
      false,
      "Tree 0 must not recognize tree 1's root"
    );

    assert.strictEqual(
      await merkle.isValidRoot(1, tree0Root),
      false,
      "Tree 1 must not recognize tree 0's root"
    );
  });
});
