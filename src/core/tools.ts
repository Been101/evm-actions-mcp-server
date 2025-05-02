import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";
import { type Address, type Hex } from "viem";
import { MonadPixelABI, ContractAddress } from "../abi/index.js";

/**
 * Register all EVM-related tools with the MCP server
 *
 * @param server The MCP server instance
 */
export function registerEVMTools(server: McpServer) {
  // NETWORK INFORMATION TOOLS

  // Get chain information
  server.tool(
    "get_chain_info",
    "Get information about an EVM network",
    {
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet."
        ),
    },
    async ({ network = "ethereum" }) => {
      try {
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  chainId,
                  blockNumber: blockNumber.toString(),
                  rpcUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching chain info: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get supported networks
  server.tool(
    "get_supported_networks",
    "Get a list of supported EVM networks",
    {},
    async () => {
      try {
        const networks = getSupportedNetworks();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  supportedNetworks: networks,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching supported networks: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get block by number
  server.tool(
    "get_block_by_number",
    "Get a block by its block number",
    {
      blockNumber: z.number().describe("The block number to fetch"),
      network: z
        .string()
        .optional()
        .describe("Network name or chain ID. Defaults to Ethereum mainnet."),
    },
    async ({ blockNumber, network = "ethereum" }) => {
      try {
        const block = await services.getBlockByNumber(blockNumber, network);

        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson(block),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block ${blockNumber}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get latest block
  server.tool(
    "get_latest_block",
    "Get the latest block from the EVM",
    {
      network: z
        .string()
        .optional()
        .describe("Network name or chain ID. Defaults to Ethereum mainnet."),
    },
    async ({ network = "ethereum" }) => {
      try {
        const block = await services.getLatestBlock(network);

        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson(block),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching latest block: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // BALANCE TOOLS

  // Get ETH balance
  server.tool(
    "get_balance",
    "Get the native token balance (ETH, MATIC, etc.) for an address",
    {
      address: z
        .string()
        .describe(
          "The wallet address or ENS name (e.g., '0x1234...' or 'vitalik.eth') to check the balance for"
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet."
        ),
    },
    async ({ address, network = "ethereum" }) => {
      try {
        const balance = await services.getETHBalance(address, network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address,
                  network,
                  wei: balance.wei.toString(),
                  ether: balance.ether,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching balance: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get ERC20 balance
  server.tool(
    "get_erc20_balance",
    "Get the ERC20 token balance of an Ethereum address",
    {
      address: z.string().describe("The Ethereum address to check"),
      tokenAddress: z.string().describe("The ERC20 token contract address"),
      network: z
        .string()
        .optional()
        .describe("Network name or chain ID. Defaults to Ethereum mainnet."),
    },
    async ({ address, tokenAddress, network = "ethereum" }) => {
      try {
        const balance = await services.getERC20Balance(
          tokenAddress as Address,
          address as Address,
          network
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address,
                  tokenAddress,
                  network,
                  balance: {
                    raw: balance.raw.toString(),
                    formatted: balance.formatted,
                    decimals: balance.token.decimals,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching ERC20 balance for ${address}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get ERC20 token balance
  server.tool(
    "get_token_balance",
    "Get the balance of an ERC20 token for an address",
    {
      tokenAddress: z
        .string()
        .describe(
          "The contract address or ENS name of the ERC20 token (e.g., '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' for USDC or 'uniswap.eth')"
        ),
      ownerAddress: z
        .string()
        .describe(
          "The wallet address or ENS name to check the balance for (e.g., '0x1234...' or 'vitalik.eth')"
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet."
        ),
    },
    async ({ tokenAddress, ownerAddress, network = "ethereum" }) => {
      try {
        const balance = await services.getERC20Balance(
          tokenAddress,
          ownerAddress,
          network
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tokenAddress,
                  owner: ownerAddress,
                  network,
                  raw: balance.raw.toString(),
                  formatted: balance.formatted,
                  symbol: balance.token.symbol,
                  decimals: balance.token.decimals,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching token balance: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Read contract
  server.tool(
    "read_contract",
    "Read data from a smart contract by calling a view/pure function. This doesn't modify blockchain state and doesn't require gas or signing.",
    {
      contractAddress: z
        .string()
        .describe("The address of the smart contract to interact with"),
      abi: z
        .array(z.any())
        .describe(
          "The ABI (Application Binary Interface) of the smart contract function, as a JSON array"
        ),
      functionName: z
        .string()
        .describe(
          "The name of the function to call on the contract (e.g., 'balanceOf')"
        ),
      args: z
        .array(z.any())
        .optional()
        .describe(
          "The arguments to pass to the function, as an array (e.g., ['0x1234...'])"
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', 'polygon') or chain ID. Defaults to Ethereum mainnet."
        ),
    },
    async ({
      contractAddress,
      abi = MonadPixelABI,
      functionName = "getAllPixels",
      args = [],
      network = "monadtestnet",
    }) => {
      try {
        // Parse ABI if it's a string
        const parsedAbi = typeof abi === "string" ? JSON.parse(abi) : abi;

        const params = {
          address: (contractAddress as Address) || ContractAddress,
          abi: parsedAbi,
          functionName,
          args,
        };

        const result = await services.readContract(params, network);

        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading contract: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Write to contract
  server.tool(
    "write_contract",
    "Write data to a smart contract by calling a state-changing function. This modifies blockchain state and requires gas payment and transaction signing.",
    {
      contractAddress: z
        .string()
        .describe("The address of the smart contract to interact with"),
      abi: z
        .array(z.any())
        .describe(
          "The ABI (Application Binary Interface) of the smart contract function, as a JSON array"
        ),
      functionName: z
        .string()
        .describe(
          "The name of the function to call on the contract (e.g., 'transfer')"
        ),
      args: z
        .array(z.any())
        .describe(
          "The arguments to pass to the function, as an array (e.g., ['0x1234...', '1000000000000000000'])"
        ),
      privateKey: z
        .string()
        .describe(
          "Private key of the sending account in hex format (with or without 0x prefix). SECURITY: This is used only for transaction signing and is not stored."
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'monadtestnet', 'optimism', 'arbitrum', 'base', 'polygon') or chain ID. Defaults to Ethereum mainnet."
        ),
    },
    async ({
      contractAddress,
      abi = MonadPixelABI,
      functionName = "mint",
      args,
      privateKey,
      network = "monadtestnet",
    }) => {
      try {
        // Parse ABI if it's a string
        const parsedAbi = typeof abi === "string" ? JSON.parse(abi) : abi;

        const contractParams: Record<string, any> = {
          address: contractAddress as Address,
          abi: parsedAbi,
          functionName,
          args,
        };

        const txHash = await services.writeContract(
          privateKey as Hex,
          contractParams,
          network
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  transactionHash: txHash,
                  message: "Contract write transaction sent successfully",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error writing to contract: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Check if address is a contract
  server.tool(
    "is_contract",
    "Check if an address is a smart contract or an externally owned account (EOA)",
    {
      address: z
        .string()
        .describe(
          "The wallet or contract address or ENS name to check (e.g., '0x1234...' or 'uniswap.eth')"
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', etc.) or chain ID. Supports all EVM-compatible networks. Defaults to Ethereum mainnet."
        ),
    },
    async ({ address, network = "ethereum" }) => {
      try {
        const isContract = await services.isContract(address, network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address,
                  network,
                  isContract,
                  type: isContract
                    ? "Contract"
                    : "Externally Owned Account (EOA)",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking if address is a contract: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get ERC20 token information
  server.tool(
    "get_token_info",
    "Get comprehensive information about an ERC20 token including name, symbol, decimals, total supply, and other metadata. Use this to analyze any token on EVM chains.",
    {
      tokenAddress: z
        .string()
        .describe(
          "The contract address of the ERC20 token (e.g., '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' for USDC on Ethereum)"
        ),
      network: z
        .string()
        .optional()
        .describe(
          "Network name (e.g., 'ethereum', 'optimism', 'arbitrum', 'base', 'polygon') or chain ID. Defaults to Ethereum mainnet."
        ),
    },
    async ({ tokenAddress, network = "ethereum" }) => {
      try {
        const tokenInfo = await services.getERC20TokenInfo(
          tokenAddress as Address,
          network
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address: tokenAddress,
                  network,
                  ...tokenInfo,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching token info: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // WALLET TOOLS

  // Get address from private key
  server.tool(
    "get_address_from_private_key",
    "Get the EVM address derived from a private key",
    {
      privateKey: z
        .string()
        .describe(
          "Private key in hex format (with or without 0x prefix). SECURITY: This is used only for address derivation and is not stored."
        ),
    },
    async ({ privateKey }) => {
      try {
        // Ensure the private key has 0x prefix
        const formattedKey = privateKey.startsWith("0x")
          ? (privateKey as Hex)
          : (`0x${privateKey}` as Hex);

        const address = services.getAddressFromPrivateKey(formattedKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address,
                  privateKey: "0x" + privateKey.replace(/^0x/, ""),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deriving address from private key: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
