/**
 * Direct Amazon Purchase using MCP tools
 * This script bypasses the regular GOAT SDK tools and uses MCP tools directly
 */
import dotenv from 'dotenv';
import { initializeGoatTools, extractAmazonProductId, formatProductLocator } from './index';

// Load environment variables
dotenv.config();

// User information for the purchase
const userInfo = {
  name: "Joyce Lee",
  email: "crossmintdemo@gmail.com",
  shippingAddress: "Joyce Lee, 123 Main St, Anytown, CA 12345, US"
};

// Amazon product URL
const amazonUrl = "https://www.amazon.com/dp/B0CJCK8LCJ/ref=twister_B0D3TK8MMP";

async function directPurchase() {
  try {
    console.log('=== Direct Amazon Purchase ===');
    console.log(`User: ${userInfo.name}`);
    console.log(`Email: ${userInfo.email}`);
    console.log(`Shipping Address: ${userInfo.shippingAddress}`);
    console.log(`Product URL: ${amazonUrl}`);
    console.log('================================');
    
    // Initialize wallet and tools
    const { tools, walletAddress } = await initializeGoatTools();
    console.log(`Wallet address: ${walletAddress}`);
    
    // Extract the product ID
    const productId = extractAmazonProductId(amazonUrl);
    console.log(`Product ID: ${productId}`);
    
    // Format the product locator
    const productLocator = formatProductLocator(productId);
    console.log(`Product locator: ${productLocator}`);
    
    // Parse the shipping address
    const addressParts = userInfo.shippingAddress.split(", ");
    const street = addressParts[1];
    const city = addressParts[2];
    const stateZip = addressParts[3].split(" ");
    const state = stateZip[0];
    const postalCode = stateZip[1];
    const country = addressParts[4] || "US";
    
    // Get USDC token info
    const typedTools = tools as any;
    const tokenInfo = await typedTools.get_token_info_by_symbol.execute({ symbol: 'USDC' }, { messages: [] });
    console.log('USDC token info:', tokenInfo);
    
    // Try to check USDC balance directly using the buy_token tool
    console.log('\nPreparing purchase parameters...');
    
    // Create purchase parameters
    const purchaseParams = {
      recipient: {
        email: userInfo.email,
        physicalAddress: {
          name: userInfo.name,
          line1: street,
          city: city,
          state: state,
          postalCode: postalCode,
          country: "US",
        },
      },
      payment: {
        method: "base",
        currency: "usdc",
        payerAddress: walletAddress,
        chain: "base",
        tokenAddress: tokenInfo.contractAddress,
      },
      lineItems: [
        {
          productLocator: productLocator,
        },
      ],
    };
    
    console.log('Purchase parameters:', JSON.stringify(purchaseParams, null, 2));
    
    // Execute the purchase using the buy_token tool
    console.log('\nExecuting purchase...');
    const buyTokenTool = typedTools.buy_token;
    
    if (buyTokenTool && typeof buyTokenTool.execute === 'function') {
      try {
        // Make the purchase with the correct options parameter
        const result = await buyTokenTool.execute(purchaseParams, { 
          messages: [] 
        });
        
        console.log('\n✅ Purchase successful!');
        console.log('Result:', result);
        return result;
      } catch (error: any) {
        console.error('\n❌ Purchase failed:');
        console.error(error.message || error);
        
        // Try to provide more detailed error information
        if (error.message && error.message.includes('Insufficient funds')) {
          console.error('\nInsufficient funds error details:');
          console.error(`Wallet address: ${walletAddress}`);
          console.error(`USDC contract on Base: ${tokenInfo.contractAddress}`);
          
          // Try to get the required amount from the error message
          const amountMatch = error.message.match(/(\d+(\.\d+)?)\s*USDC/i);
          if (amountMatch) {
            console.error(`Required amount: ${amountMatch[1]} USDC`);
          }
        }
        
        throw error;
      }
    } else {
      throw new Error('buy_token tool not available or not properly initialized');
    }
  } catch (error: any) {
    console.error('Error during direct purchase:', error.message || error);
    throw error;
  }
}

// Execute the direct purchase
directPurchase()
  .then(result => {
    console.log('Purchase completed successfully');
  })
  .catch(error => {
    console.error('Purchase process failed');
    process.exit(1);
  });
