/**
 * Amazon Purchase Agent Integration
 * 
 * This module provides functions to integrate Amazon purchasing capabilities
 * into any agent framework using GOAT SDK plugins.
 */

import "dotenv/config";

// Import Viem for wallet operations
import { http } from "viem";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// Import GOAT SDK components
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { crossmintHeadlessCheckout } from "@goat-sdk/plugin-crossmint-headless-checkout";
import { USDC, erc20 } from "@goat-sdk/plugin-erc20";
import { sendETH } from "@goat-sdk/wallet-evm";
import { viem } from "@goat-sdk/wallet-viem";

/**
 * Initialize the wallet and GOAT tools
 * @returns The initialized GOAT tools and wallet address
 */
export async function initializeGoatTools() {
  // Create a wallet client using the private key from .env
  const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account: account,
    transport: http(process.env.RPC_PROVIDER_URL),
    chain: base,
  });

  // Get the wallet address
  const walletAddress = account.address;
  console.log(`Initialized wallet: ${walletAddress}`);

  // Initialize GOAT tools with the wallet and required plugins
  const tools = await getOnChainTools({
    wallet: viem(walletClient),
    plugins: [
      // Enable ERC20 token operations (USDC)
      erc20({ tokens: [USDC] }),
      
      // Enable Crossmint headless checkout for purchases
      crossmintHeadlessCheckout({
        apiKey: process.env.CROSSMINT_API_KEY as string,
      }),
    ],
  });

  // Log available tools for debugging
  console.log('Available tools:', Object.keys(tools));

  return { tools, walletAddress };
}

/**
 * Extract the Amazon product ID (ASIN) from a URL
 * @param amazonUrl The Amazon product URL
 * @returns The Amazon product ID (ASIN)
 */
export function extractAmazonProductId(amazonUrl: string): string {
  // Extract the ASIN from the URL
  // Amazon URLs typically contain the ASIN in the format /dp/ASIN or /gp/product/ASIN
  // Sometimes followed by /ref= or other parameters
  const dpMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})(\/|\?|$)/);
  const gpMatch = amazonUrl.match(/\/gp\/product\/([A-Z0-9]{10})(\/|\?|$)/);
  
  const asin = dpMatch?.[1] || gpMatch?.[1];
  
  if (!asin) {
    throw new Error("Could not extract product ID from Amazon URL");
  }
  
  return asin;
}

/**
 * Format an Amazon product ID into the required product locator format
 * @param productId The Amazon product ID (ASIN)
 * @returns The formatted product locator
 */
export function formatProductLocator(productId: string): string {
  // Format according to the requirements: 'amazon:B08SVZ775L'
  return `amazon:${productId}`;
}

/**
 * Purchase a product using the Crossmint headless checkout
 * @param tools The GOAT tools
 * @param productId The Amazon product ID (ASIN)
 * @param walletAddress The wallet address to pay from
 * @param purchaseInfo The purchase information
 * @returns The purchase result
 */
export async function purchaseProduct(
  tools: any,
  productId: string,
  walletAddress: string,
  purchaseInfo: {
    name: string;
    shippingAddress: string;
    email: string;
  }
) {
  // Parse the shipping address
  // Expected format: "Name, Street, City, State ZIP, Country"
  const addressParts = purchaseInfo.shippingAddress.split(", ");
  if (addressParts.length < 4) {
    throw new Error("Invalid shipping address format. Expected: Name, Street, City, State ZIP, Country");
  }
  
  // Extract address components
  const street = addressParts[1];
  const city = addressParts[2];
  const stateZip = addressParts[3].split(" ");
  const state = stateZip[0];
  const postalCode = stateZip[1];
  const country = addressParts[4] || "US"; // Default to US if not provided
  
  // Validate country (only US is supported currently)
  if (country !== "US") {
    throw new Error("Only US shipping addresses are currently supported");
  }

  // According to the purchase requirements, we need to use buy_token
  // The purchase will auto-complete after execution as specified in the requirements
  // Check if the tool exists before trying to use it
  if (!tools || typeof tools !== 'object' || !Object.keys(tools).includes('buy_token')) {
    console.error('Available tools:', Object.keys(tools));
    throw new Error('buy_token tool not available. Please check the plugin configuration.');
  }
  
  const result = await tools['buy_token']({
    recipient: {
      email: purchaseInfo.email,
      physicalAddress: {
        name: purchaseInfo.name,
        line1: street,
        city: city,
        state: state,
        postalCode: postalCode,
        country: "US",
      },
    },
    payment: {
      method: "base", // Use Base for the transaction
      currency: "usdc", // Pay with USDC
      payerAddress: walletAddress,
    },
    lineItems: [
      {
        productLocator: formatProductLocator(productId),
      },
    ],
  });
  
  return result;
}

/**
 * Main function to handle Amazon purchases
 * This is the function that would be called by your agent framework
 */
export async function handleAmazonPurchase(
  amazonUrl: string,
  purchaseInfo: {
    name: string;
    shippingAddress: string;
    email: string;
  }
) {
  try {
    // Initialize wallet and tools
    const { tools, walletAddress } = await initializeGoatTools();
    
    // Extract the Amazon product ID from the URL
    const productId = extractAmazonProductId(amazonUrl);
    console.log(`Extracted product ID: ${productId}`);
    
    // Format the product locator according to the requirements: 'amazon:B08SVZ775L'
    const productLocator = formatProductLocator(productId);
    console.log(`Using product locator: ${productLocator}`);
    
    // Parse the shipping address
    // Expected format: "Name, Street, City, State ZIP, Country"
    const addressParts = purchaseInfo.shippingAddress.split(", ");
    if (addressParts.length < 4) {
      throw new Error("Invalid shipping address format. Expected: Name, Street, City, State ZIP, Country");
    }
    
    // Extract address components
    const street = addressParts[1];
    const city = addressParts[2];
    const stateZip = addressParts[3].split(" ");
    const state = stateZip[0];
    const postalCode = stateZip[1];
    const country = addressParts[4] || "US"; // Default to US if not provided
    
    // Directly call the buy_token function with the required parameters
    console.log("Executing purchase...");
    
    // According to the purchase requirements:
    // 1. Required information: Name, Shipping address, Email, Payment method (USDC), Preferred chain (Base)
    // 2. Product locator format: 'amazon:B08SVZ775L'
    // 3. No pre-purchase balance check required
    // 4. Auto-complete purchase after buy_token execution
    const purchaseParams = {
      recipient: {
        email: purchaseInfo.email,
        physicalAddress: {
          name: purchaseInfo.name,
          line1: street,
          city: city,
          state: state,
          postalCode: postalCode,
          country: "US",
        },
      },
      payment: {
        method: "base", // Use Base for the transaction
        currency: "usdc", // Pay with USDC
        payerAddress: walletAddress,
        // Explicitly specify the chain and token
        chain: "base",
        tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      },
      lineItems: [
        {
          productLocator: productLocator,
        },
      ],
    };
    
    // Log the purchase parameters
    console.log("Purchase parameters:", JSON.stringify(purchaseParams, null, 2));
    
    // Execute the purchase
    // The buy_token function is accessed using bracket notation since it contains an underscore
    if (!tools || typeof tools !== 'object') {
      throw new Error('Tools not properly initialized');
    }
    
    // Log available tools for debugging
    console.log('Available tools:', Object.keys(tools));
    
    // Based on the purchase requirements and the GOAT SDK structure,
    // we need to access the buy_token tool correctly
    // The tools object contains the tool definitions, but they may not be directly callable
    
    // Check if the tool exists
    if (!tools.hasOwnProperty('buy_token')) {
      throw new Error('buy_token tool not found in the available tools');
    }
    
    // In GOAT SDK, tools might be objects with a 'call' method rather than functions
    // Let's try to access it properly
    const buyTokenTool = (tools as any)['buy_token'];
    
    // Log the tool structure for debugging
    console.log('Buy token tool structure:', typeof buyTokenTool, 
                Object.keys(buyTokenTool || {}));
    
    // In GOAT SDK, the buy_token tool should have an execute method
    // Let's directly call it without trying multiple approaches
    let result;
    
    try {
      // Create a new order first
      console.log('Creating order...');
      
      // The Crossmint API requires creating an order first
      // This is done through the buy_token.execute method
      // GOAT SDK tools require a second options parameter with messages array
      const order = await buyTokenTool.execute(purchaseParams, { messages: [] });
      console.log('Created order:', order.id || order);
      
      // If we get here, the order was created successfully
      result = order;
    } catch (error: any) {
      // Log detailed error information
      console.error('Error executing buy_token tool:', error);
      
      // Check if there's a specific error message about funds
      if (error.message && error.message.includes('Insufficient funds')) {
        console.error('Wallet does not have enough USDC. Please fund your wallet with USDC on Base.');
        
        // Get the USDC token info to show the contract address
        try {
          if (tools.get_token_info_by_symbol && typeof tools.get_token_info_by_symbol.execute === 'function') {
            const tokenInfo = await tools.get_token_info_by_symbol.execute({ symbol: 'USDC' }, { messages: [] });
            console.error(`USDC contract address on Base: ${tokenInfo.contractAddress}`);
            console.error(`Please send USDC to wallet: ${walletAddress}`);
          }
        } catch (tokenError) {
          // Ignore token info errors
        }
      }
      
      // Re-throw the error
      throw error;
    }
    
    console.log("Purchase completed!");
    return result;
    
  } catch (error: any) {
    console.error("Error during Amazon purchase:", error);
    throw error;
  }
}
