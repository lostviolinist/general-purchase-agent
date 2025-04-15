/**
 * Test file for Amazon Purchase Agent
 * 
 * This file demonstrates how to use the Amazon purchase integration
 * with the user information from your requirements.
 * 
 * Purchase requirements:
 * 1. Required information: Name, Shipping address, Email, Payment method (USDC), Preferred chain (Base)
 * 2. Product locator format: 'amazon:B08SVZ775L'
 * 3. No pre-purchase balance check required
 * 4. Auto-complete purchase after buy_token execution
 */

import { handleAmazonPurchase, initializeGoatTools } from './index';

// User information from your requirements
const userInfo = {
  name: "Joyce Lee",
  shippingAddress: "Joyce Lee, 1 SE 3rd Ave, Miami, FL 33131, US",
  email: "crossmintdemo@gmail.com"
};

// Example Amazon product URL with ASIN
const amazonUrl = "https://www.amazon.com/dp/B0CJCK8LCJ/ref=twister_B0D3TK8MMP";

console.log("=== Amazon Purchase Agent Test ===");
console.log(`User: ${userInfo.name}`);
console.log(`Email: ${userInfo.email}`);
console.log(`Shipping Address: ${userInfo.shippingAddress}`);
console.log(`Product URL: ${amazonUrl}`);
console.log("================================");

// Initialize tools and check wallet balance first
async function runTest() {
  try {
    // Initialize tools and get wallet address
    const { tools, walletAddress } = await initializeGoatTools();
    console.log(`Checking balance for wallet: ${walletAddress}`);
    
    // Check if the tools are available
    console.log('Available tools:', Object.keys(tools));
    
    // Check the wallet's ETH balance
    try {
      if (typeof (tools as any).get_balance === 'function') {
        console.log('Getting ETH balance...');
        const ethBalance = await (tools as any).get_balance({ address: walletAddress });
        console.log(`ETH Balance:`, JSON.stringify(ethBalance, null, 2));
      } else if (typeof (tools as any).get_balance?.execute === 'function') {
        console.log('Getting ETH balance...');
        const ethBalance = await (tools as any).get_balance.execute({ address: walletAddress }, { messages: [] });
        console.log(`ETH Balance:`, JSON.stringify(ethBalance, null, 2));
      } else {
        console.log('ETH balance check not available');
      }
    } catch (error: any) {
      console.error('Error checking ETH balance:', error.message || error);
    }
    
    // Try to check USDC balance
    try {
      // First try to get token info
      if (typeof (tools as any).get_token_info_by_symbol === 'function' || 
          typeof (tools as any).get_token_info_by_symbol?.execute === 'function') {
        
        console.log('Getting USDC token info...');
        // Get token info with proper options parameter
        let tokenInfo;
        if (typeof (tools as any).get_token_info_by_symbol === 'function') {
          tokenInfo = await (tools as any).get_token_info_by_symbol({ symbol: 'USDC' });
        } else if (typeof (tools as any).get_token_info_by_symbol?.execute === 'function') {
          tokenInfo = await (tools as any).get_token_info_by_symbol.execute({ symbol: 'USDC' }, { messages: [] });
        }
        console.log('USDC token info:', tokenInfo);
        
        // Then get token balance
        if (tokenInfo && tokenInfo.contractAddress) {
          console.log('Getting USDC balance...');
          
          // Get token balance with proper options parameter
          try {
            let balance;
            if (typeof (tools as any).get_token_balance === 'function') {
              balance = await (tools as any).get_token_balance({
                tokenAddress: tokenInfo.contractAddress,
                walletAddress: walletAddress
              });
            } else if (typeof (tools as any).get_token_balance?.execute === 'function') {
              balance = await (tools as any).get_token_balance.execute({
                tokenAddress: tokenInfo.contractAddress,
                walletAddress: walletAddress
              }, { messages: [] });
            }
            
            console.log(`USDC Balance:`, JSON.stringify(balance, null, 2));
            
            // Try to parse the balance if it's an object
            if (typeof balance === 'object') {
              if (balance.value !== undefined) {
                const numericBalance = Number(balance.value) / Math.pow(10, tokenInfo.decimals);
                console.log(`USDC Balance (formatted): ${numericBalance} USDC`);
              }
            } else if (typeof balance === 'string' || typeof balance === 'number') {
              const numericBalance = Number(balance) / Math.pow(10, tokenInfo.decimals);
              console.log(`USDC Balance (formatted): ${numericBalance} USDC`);
            }
          } catch (error: any) {
            console.error('Error getting token balance:', error.message || error);
          }
        }
      } else {
        console.log('USDC token info check not available');
      }
    } catch (error: any) {
      console.error('Error checking USDC balance:', error.message || error);
    }
    
    // Run the purchase flow
    console.log('\nAttempting purchase...');
    const result = await handleAmazonPurchase(amazonUrl, userInfo);
    
    console.log("\n✅ Purchase completed successfully!");
    console.log(`Order ID: ${result.order?.orderId || 'N/A'}`);
    console.log(`Transaction ID: ${result.txId || 'N/A'}`);
  } catch (error: any) {
    console.error("\n❌ Purchase failed:");
    console.error(error.message);
  }
}

// Run the test
runTest();
