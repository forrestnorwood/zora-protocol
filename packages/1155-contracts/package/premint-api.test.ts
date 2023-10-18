import {
  createTestClient,
  http,
  createWalletClient,
  createPublicClient,
  Address,
} from "viem";
import { foundry } from "viem/chains";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { parseEther } from "viem";
import {
  zoraCreator1155FactoryImplAddress,
} from "./wagmiGenerated";
import { BackendChainNames, PreminterAPI } from "./premint-api";

const chain = foundry;

const walletClient = createWalletClient({
  chain,
  transport: http(),
});

const testClient = createTestClient({
  chain,
  mode: "anvil",
  transport: http(),
});

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

// JSON-RPC Account
const [deployerAccount, secondWallet] = (await walletClient.getAddresses()) as [
  Address,
  Address
];

type TestContext = {
  preminterAddress: `0x${string}`;
  forkedChainId: keyof typeof zoraCreator1155FactoryImplAddress;
  anvilChainId: number;
  zoraMintFee: bigint;
  fixedPriceMinterAddress: Address;
};

describe("ZoraCreator1155Preminter", () => {
  beforeEach<TestContext>(async () => {
    // deploy signature minter contract
    await testClient.setBalance({
      address: deployerAccount,
      value: parseEther("1"),
    });

    await testClient.setBalance({
      address: secondWallet,
      value: parseEther("1"),
    });
  }, 20 * 1000);

  // skip for now - we need to make this work on zora testnet chain too
  it<TestContext>(
    "can sign on the forked premint contract",
    async () => {
      const preminterApi = new PreminterAPI(chain);

      preminterApi.get = vi.fn().mockResolvedValue({ next_uid: 3 });
      preminterApi.post = vi.fn().mockResolvedValue({ ok: true });

      const premint = await preminterApi.createPremint({
        walletClient,
        publicClient,
        account: deployerAccount,
        checkSignature: true,
        collection: {
          contractAdmin: deployerAccount,
          contractName: "Testing Contract",
          contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
        },
        token: {
          tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
        },
      });

      expect(preminterApi.post).toHaveBeenCalledWith(
        "https://api.zora.co/premint/signature",
        {
          chain_name: BackendChainNames.ZORA_TESTNET,
          collection: {
            contractAdmin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            contractName: "Testing Contract",
            contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
          },
          premint: {
            deleted: false,
            tokenConfig: {
              fixedPriceMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
              maxSupply: "18446744073709551615",
              maxTokensPerAddress: "0",
              mintDuration: "604800",
              mintStart: "0",
              pricePerToken: "0",
              royaltyBPS: 1000,
              royaltyMintSchedule: 0,
              royaltyRecipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
              tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
            },
            uid: 3,
            version: 1,
          },
          signature:
            "0x588d19641de9ba1dade4d2bb5387c8dc96f4a990fef69787534b60caead759e6334975a6be10a796da948cd7d1d4f5580b3f84d49d9fa4e0b41c97759507975a1c",
        }
      );

      console.log({ premint });
    },
    20 * 1000
  );

  it<TestContext>("can validate premint on network", async () => {
    const preminter = new PreminterAPI(chain);

    const premintData = {
      collection: {
        contractAdmin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        contractName: "Testing Contract",
        contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
      },
      premint: {
        uid: 3,
        version: 1,
        deleted: false,
        tokenConfig: {
          maxSupply: "18446744073709551615",
          maxTokensPerAddress: "0",
          pricePerToken: "0",
          mintDuration: "604800",
          mintStart: "0",
          royaltyMintSchedule: 0,
          royaltyBPS: 1000,
          fixedPriceMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
          royaltyRecipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
        },
      },
      chain_name: "ZORA-TESTNET",
      signature:
        "0x588d19641de9ba1dade4d2bb5387c8dc96f4a990fef69787534b60caead759e6334975a6be10a796da948cd7d1d4f5580b3f84d49d9fa4e0b41c97759507975a1c",
    } as const;
    const publicClient = createPublicClient({
      chain: foundry,
      transport: http(),
    });
    const signatureValid = await preminter.isValidSignature({
      // @ts-ignore: Fix enum type
      data: premintData,
      publicClient,
    });
    console.log({ signatureValid });
  });

  it<TestContext>(
    "can execute premint on network",
    async () => {
      const preminterApi = new PreminterAPI(chain);

      preminterApi.get = vi.fn().mockResolvedValue({
        chain_name: "ZORA-TESTNET",
        collection: {
          contractAdmin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          contractName: "Testing Contract",
          contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
        },
        premint: {
          deleted: false,
          tokenConfig: {
            fixedPriceMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
            maxSupply: "18446744073709551615",
            maxTokensPerAddress: "0",
            mintDuration: "604800",
            mintStart: "0",
            pricePerToken: "0",
            royaltyBPS: 1000,
            royaltyMintSchedule: 0,
            royaltyRecipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
          },
          uid: 3,
          version: 1,
        },
        signature:
          "0x588d19641de9ba1dade4d2bb5387c8dc96f4a990fef69787534b60caead759e6334975a6be10a796da948cd7d1d4f5580b3f84d49d9fa4e0b41c97759507975a1c",
      });
      preminterApi.post = vi.fn();

      console.log({ deployerAccount });

      const premint = await preminterApi.executePremintWithWallet({
        data: await preminterApi.getPremintData(
          "0xf8dA7f53c283d898818af7FB9d98103F559bDac2",
          3
        ),
        account: deployerAccount,
        walletClient,
        publicClient,
        mintArguments: {
          quantityToMint: 1,
          mintComment: "",
        },
      });

      expect(premint.log).toEqual({
        contractAddress: "0xf8dA7f53c283d898818af7FB9d98103F559bDac2",
        contractConfig: {
          contractAdmin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          contractName: "Testing Contract",
          contractURI: "ipfs://bafkreiainxen4b4wz4ubylvbhons6rembxdet4a262nf2lziclqvv7au3e",
        },
        createdNewContract: false,
        minter: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        quantityMinted: 1n,
        tokenConfig: {
          fixedPriceMinter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
          maxSupply: 18446744073709551615n,
          maxTokensPerAddress: 0n,
          mintDuration: 604800n,
          mintStart: 0n,
          pricePerToken: 0n,
          royaltyBPS: 1000,
          royaltyMintSchedule: 0,
          royaltyRecipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          tokenURI: "ipfs://bafkreice23maski3x52tsfqgxstx3kbiifnt5jotg3a5ynvve53c4soi2u",
        },
        tokenId: 1n,
        uid: 3,
      });
    },
    20 * 1000
  );
});
