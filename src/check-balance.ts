/**
 * Script to check USDC balance on Base
 * This uses the MCP tools to directly check the balance
 */
import dotenv from 'dotenv';
import { initializeGoatTools } from './index';

// Load environment variables
dotenv.config();

async function checkBalance() {
  try {
    console.log('=== Checking Wallet Balance ===');
    
    // Initialize the wallet and tools
    const { tools, walletAddress } = await initializeGoatTools();
    console.log(`Wallet address: ${walletAddress}`);
    console.log('Available tools:', Object.keys(tools));
    
    // Type the tools as any to avoid TypeScript errors
    const typedTools = tools as any;
    
    // Get USDC token info
    console.log('\nGetting USDC token info...');
    if (typedTools.get_token_info_by_symbol?.execute) {
      const tokenInfo = await typedTools.get_token_info_by_symbol.execute({ symbol: 'USDC' }, { messages: [] });
      console.log('USDC token info:', tokenInfo);
      
      // Check ETH balance
      console.log('\nChecking ETH balance...');
      if (typedTools.get_balance?.execute) {
        const ethBalance = await typedTools.get_balance.execute({ address: walletAddress }, { messages: [] });
        console.log('ETH balance:', ethBalance);
      } else {
        console.log('get_balance tool not available');
      }
      
      // Try to directly check USDC balance using the MCP tools
      console.log('\nTrying to check USDC balance using MCP tools...');
      
      // First try to get the chain
      if (typedTools.get_chain?.execute) {
        const chain = await typedTools.get_chain.execute({}, { messages: [] });
        console.log('Current chain:', chain);
      } else {
        console.log('get_chain tool not available');
      }
      
      // Try to get the token balance using different methods
      try {
        if (typedTools.get_token_balance?.execute) {
          console.log('\nAttempting to get token balance...');
          const tokenBalance = await typedTools.get_token_balance.execute({
            tokenAddress: tokenInfo.contractAddress,
            walletAddress: walletAddress
          }, { messages: [] });
          
          console.log('USDC Balance:', tokenBalance);
          
          if (typeof tokenBalance === 'object' && tokenBalance.value) {
            const formattedBalance = Number(tokenBalance.value) / Math.pow(10, tokenInfo.decimals);
            console.log(`Formatted USDC Balance: ${formattedBalance} USDC`);
          }
        } else {
          console.log('get_token_balance tool not available');
        }
      } catch (error: any) {
        console.error('Error getting token balance:', error.message || error);
        
        // Try alternative method
        console.log('\nTrying alternative method to get token balance...');
        try {
          // Try to use the convert_to_base_unit tool to check units
          if (typedTools.convert_to_base_unit?.execute) {
            const baseUnit = await typedTools.convert_to_base_unit.execute({
              amount: 1,
              decimals: tokenInfo.decimals
            }, { messages: [] });
            console.log('1 USDC in base units:', baseUnit);
          } else {
            console.log('convert_to_base_unit tool not available');
          }
          
          // Try to use MCP tools directly
          if (typeof (global as any).mcp0_get_token_balance_by_mint_address === 'function') {
            console.log('Using MCP tool to check balance...');
            const balance = await (global as any).mcp0_get_token_balance_by_mint_address({
              mintAddress: tokenInfo.contractAddress,
              walletAddress: walletAddress
            });
            console.log('USDC Balance from MCP:', balance);
          } else {
            console.log('MCP tools not available');
          }
        } catch (altError: any) {
          console.error('Alternative method failed:', altError.message || altError);
        }
      }
    } else {
      console.log('get_token_info_by_symbol tool not available');
    }
    
    console.log('\n=== Balance Check Complete ===');
  } catch (error: any) {
    console.error('Error checking balance:', error.message || error);
  }
}

// Run the balance check
checkBalance();
