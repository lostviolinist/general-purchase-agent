/**
 * Example of how to integrate the Amazon purchase functionality
 * into an existing agent framework
 * 
 * This file demonstrates the key integration points for your agent
 * 
 * Purchase requirements:
 * 1. Required information: Name, Shipping address, Email, Payment method (USDC), Preferred chain (Base)
 * 2. Product locator format: 'amazon:B08SVZ775L'
 * 3. No pre-purchase balance check required
 * 4. Auto-complete purchase after buy_token execution
 */

import { handleAmazonPurchase } from './index';

/**
 * This is a simplified example of how your agent framework might
 * integrate with the Amazon purchase functionality
 */
export class YourAgentFramework {
  // Your agent's existing code and state would be here
  
  /**
   * Method to handle when a user wants to purchase something from Amazon
   * This would be called when your agent detects a purchase intent
   */
  async handleAmazonPurchaseIntent(userInput: string) {
    // 1. Extract the Amazon URL from user input
    // This is a simplified example - your agent would likely have more sophisticated NLP
    const urlMatch = userInput.match(/(https?:\/\/www\.amazon\.com\/[^\s]+)/);
    if (!urlMatch) {
      return "I couldn't find an Amazon URL in your request. Please provide a valid Amazon product URL.";
    }
    
    const amazonUrl = urlMatch[1];
    
    // 2. Get user information (this could come from your agent's user profile or session)
    // For this example, we're using the information from the requirements
    const userInfo = {
      name: "Joyce Lee",
      shippingAddress: "Joyce Lee, 123 Main St, Anytown, CA 12345, US",
      email: "crossmintdemo@gmail.com"
    };
    
    try {
      // 3. Call the Amazon purchase handler
      const result = await handleAmazonPurchase(amazonUrl, userInfo);
      
      // 4. Return a success message to the user
      return `
        Great news! I've completed your purchase from Amazon.
        
        Order ID: ${result.order.orderId}
        Transaction ID: ${result.txId}
        
        Your item will be shipped to: ${userInfo.shippingAddress}
        You'll receive a confirmation email at: ${userInfo.email}
      `;
    } catch (error) {
      // 5. Handle any errors
      console.error("Purchase failed:", error);
      return `
        I'm sorry, but I couldn't complete your Amazon purchase.
        Error: ${error.message}
        
        Please check your wallet balance and try again later.
      `;
    }
  }
  
  /**
   * Example of how your agent might process a user message
   * This is a simplified version of what your agent framework would do
   */
  async processUserMessage(userMessage: string) {
    // Detect if this is an Amazon purchase request
    if (userMessage.includes("buy") && userMessage.includes("amazon")) {
      return this.handleAmazonPurchaseIntent(userMessage);
    }
    
    // Other agent functionality would go here
    return "I'm your agent. How can I help you today?";
  }
}

// Example usage
if (require.main === module) {
  const agent = new YourAgentFramework();
  
  // Simulate a user request to buy something from Amazon
  const userMessage = "I want to buy this product from Amazon: https://www.amazon.com/dp/B08SVZ775L";
  
  agent.processUserMessage(userMessage)
    .then(response => {
      console.log("Agent response:");
      console.log(response);
    })
    .catch(error => {
      console.error("Error:", error);
    });
}
