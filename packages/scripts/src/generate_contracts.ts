import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { NetworkName } from "@party-forever/contracts";

const NETWORK_NAMES: NetworkName[] = ["base", "mainnet", "zora"];
const CONTRACT_NAMES = [
  "Party",
  "ProposalExecutionEngine",
  "BuyCrowdfund",
  "CollectionBuyCrowdfund",
  "AuctionCrowdfund",
  "CollectionBatchBuyCrowdfund",
  "InitialETHCrowdfund",
  "ERC20LaunchCrowdfund",
  "TokenDistributor",
  "PartyFactory",
  "PartyHelpers",
  "BondingCurveAuthority"
];

// Additional addresses that were pre-genesis but should be included
const ADDITIONAL_ADDRESSES = [
  ["0x88d1f63e80a48711d2a458e1924224435c10beed", "0xa51ef92ee7f24eff05f5e5cc2119c22c4f8843f6"],
  [
    "0x96e5b0519983f2f984324b926e6d28c3a4eb92a1",
    "0x11c07ce1315a3b92c9755f90cdf40b04b88c5731",
    "0x9319dad8736d752c5c72db229f8e1b280dc80ab1"
  ],
  ["0xa23399a573aaf562eec1645096218fecfdc22759", "0x2140731a4fdc2531f5138635e457d468c8f4210b"],
  ["0x48ce324bd9ce34217b9c737dda0cec2f28a0626e", "0x569d98c73d7203d6d587d0f355b66bfa258d736f"],
  ["0x57dc04a0270e9f9e6a1289c1559c84098ba0fa9c", "0x43844369a7a6e83b6da64b9b3121b4b66d71cad0"],
  ["0x51fd9005f3b9606d1aa8bd6f7455020b051e1d91", "0x13e0e3125c7a3566adf4c8067adf739699115fa3"]
];

function getAdditionalAddresses(address: string): string[] {
  const normalizedAddress = address.toLowerCase();
  for (const group of ADDITIONAL_ADDRESSES) {
    if (group.map((a) => a.toLowerCase()).includes(normalizedAddress)) {
      return group.map((a) => a.toLowerCase()).filter((a) => a !== normalizedAddress);
    }
  }
  return [];
}

const PARTY_ADDRESSES_DIR = resolve(import.meta.dirname, "../party-addresses");
const CONTRACTS_SRC_DIR = resolve(import.meta.dirname, "../../contracts/src");

interface ContractJson {
  address: string;
  abi: string;
}

function toSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function findContractFiles(
  contractName: string
): { network: NetworkName; version: string; data: ContractJson }[] {
  const results: {
    network: NetworkName;
    version: string;
    data: ContractJson;
  }[] = [];

  for (const network of NETWORK_NAMES) {
    const contractsDir = join(PARTY_ADDRESSES_DIR, "contracts", network);
    if (!existsSync(contractsDir)) {
      continue;
    }

    const versions = readdirSync(contractsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const version of versions) {
      const contractPath = join(contractsDir, version, `${contractName}.json`);
      try {
        const content = readFileSync(contractPath, "utf-8");
        const data = JSON.parse(content) as ContractJson;
        results.push({ network, version, data });
      } catch {
        // Contract doesn't exist in this version
      }
    }
  }

  return results;
}

function loadAbi(abiHash: string): unknown[] {
  const abiPath = join(PARTY_ADDRESSES_DIR, "abis", `${abiHash}.json`);
  const content = readFileSync(abiPath, "utf-8");
  return JSON.parse(content) as unknown[];
}

function generateForContract(contractName: string): string[] {
  const contractSnake = toSnakeCase(contractName);
  const contractUpper = contractSnake.toUpperCase();

  const contractFiles = findContractFiles(contractName);
  console.log(
    `Found ${contractFiles.length} ${contractName} contracts across networks: ${NETWORK_NAMES.join(", ")}`
  );

  if (contractFiles.length === 0) {
    console.log(`  No contracts found for ${contractName}, skipping.`);
    return [];
  }

  // Group by ABI hash, with addresses keyed by network
  const byAbiHash = new Map<string, { abi: unknown[]; addresses: Map<NetworkName, string[]> }>();

  for (const { network, version, data } of contractFiles) {
    console.log(`  [${network}] ${version}: ${data.address} (abi: ${data.abi})`);

    if (!byAbiHash.has(data.abi)) {
      const abi = loadAbi(data.abi);
      byAbiHash.set(data.abi, { abi, addresses: new Map() });
    }
    const entry = byAbiHash.get(data.abi)!;
    if (!entry.addresses.has(network)) {
      entry.addresses.set(network, []);
    }
    const networkAddrs = entry.addresses.get(network)!;
    const normalizedAddr = data.address.toLowerCase();
    if (!networkAddrs.includes(normalizedAddr)) {
      networkAddrs.push(normalizedAddr);
    }
    // Add any paired addresses from ADDITIONAL_ADDRESSES
    for (const additionalAddr of getAdditionalAddresses(normalizedAddr)) {
      if (!networkAddrs.includes(additionalAddr)) {
        networkAddrs.push(additionalAddr);
      }
    }
  }

  const abisDir = join(CONTRACTS_SRC_DIR, "abis");
  const configsDir = join(CONTRACTS_SRC_DIR, "configs");

  // Generate ABI files
  const abiHashes: string[] = [];
  for (const [abiHash, { abi }] of byAbiHash) {
    abiHashes.push(abiHash);
    const filename = `${contractSnake}_${abiHash}.ts`;
    const content = `export const ${contractSnake}${abiHash} = {
  abiHash: '${abiHash}',
  abi: ${JSON.stringify(abi, null, 2)},
} as const;
`;
    writeFileSync(join(abisDir, filename), content);
    console.log(`Generated abis/${filename}`);
  }

  // Generate configs/<contract>_contract_config.ts with union type and interface
  const imports = abiHashes
    .map((h) => `import { ${contractSnake}${h} } from '../abis/${contractSnake}_${h}.ts';`)
    .join("\n");

  const unionMembers = abiHashes.map((h) => `typeof ${contractSnake}${h}`).join("\n  | ");

  const contractsArray: string[] = [];
  for (const [abiHash, { addresses }] of byAbiHash) {
    const addressEntries: string[] = [];
    for (const [network, addrs] of addresses) {
      addressEntries.push(`      ${network}: ${JSON.stringify(addrs)}`);
    }
    contractsArray.push(`  {
    abi: ${contractSnake}${abiHash},
    implementationAddresses: {
${addressEntries.join(",\n")},
    },
  }`);
  }

  const contractsContent = `import type { ContractConfig } from '../contract_utils.ts';
${imports}

export type ${contractName}ABI =
  | ${unionMembers};

export const ${contractUpper}_CONTRACTS: ContractConfig<${contractName}ABI>[] = [
${contractsArray.join(",\n")},
];
`;

  const contractsFilename = `${contractSnake}_contract_config.ts`;
  writeFileSync(join(configsDir, contractsFilename), contractsContent);
  console.log(`Generated configs/${contractsFilename}`);

  return [
    `export { ${contractUpper}_CONTRACTS } from './configs/${contractsFilename}';`,
    `export type { ${contractName}ABI } from './configs/${contractsFilename}';`
  ];
}

function main() {
  // Create output directories
  const abisDir = join(CONTRACTS_SRC_DIR, "abis");
  const configsDir = join(CONTRACTS_SRC_DIR, "configs");
  mkdirSync(abisDir, { recursive: true });
  mkdirSync(configsDir, { recursive: true });

  // Remove old data directory if it exists
  const dataDir = join(CONTRACTS_SRC_DIR, "data");
  rmSync(dataDir, { recursive: true, force: true });

  // Generate contracts for each contract name
  const allExports: string[] = [];
  for (const contractName of CONTRACT_NAMES) {
    const exports = generateForContract(contractName);
    allExports.push(...exports);
  }

  // Generate generated_exports.ts (auto-generated exports only)
  const generatedExportsContent = `// Auto-generated - DO NOT EDIT
${allExports.join("\n")}
`;
  writeFileSync(join(CONTRACTS_SRC_DIR, "generated_exports.ts"), generatedExportsContent);
  console.log("Generated generated_exports.ts");
}

main();
