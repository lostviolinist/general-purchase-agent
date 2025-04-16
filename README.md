# Amazon Purchase Agent

This project provides a standalone Amazon purchase agent that integrates with GOAT SDK plugins to enable Amazon purchases using USDC on Base blockchain.

## Features

- Process Amazon product URLs and extract product IDs (ASIN)
- Format product locator as 'amazon:B08SVZ775L'
- Complete purchases using the Crossmint headless checkout plugin
- Handle shipping information and user details
- Process payments with USDC on Base blockchain
- Auto-complete purchase after buy_token execution

## Prerequisites

- Node.js and npm
- A wallet with USDC on Base
- Crossmint API key
- Base RPC provider URL

## Setup

1. Clone this repository:
   ```
   git clone <repository-url>
   cd amazon-purchase-agent
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your credentials:
   ```
   WALLET_PRIVATE_KEY=your_private_key
   CROSSMINT_API_KEY=your_crossmint_api_key
   RPC_PROVIDER_URL=your_rpc_provider_url
   ```

## Usage

### Testing the Integration

Run the test script to verify everything is working:

```
npm run test
```

This will:
1. Initialize the wallet and GOAT tools
2. Extract the product ID from an example Amazon URL
3. Search for the product
4. Attempt to purchase it using the provided user information

### Integrating with Your Agent Framework

To integrate this code into your agent framework:

1. Import the `handleAmazonPurchase` function:
   ```typescript
   import { handleAmazonPurchase } from './index';
   ```

2. Call the function when your agent needs to make a purchase:
   ```typescript
   const amazonUrl = "https://www.amazon.com/dp/B08SVZ775L"; // From user input
   const userInfo = {
     name: "Joyce Lee",
     shippingAddress: "Joyce Lee, 123 Main St, Anytown, CA 12345, US",
     email: "crossmintdemo@gmail.com"
   };

   handleAmazonPurchase(amazonUrl, userInfo)
     .then(result => {
       // Handle successful purchase
       console.log(`Purchase completed: ${result.order.orderId}`);
     })
     .catch(error => {
       // Handle errors
       console.error(`Purchase failed: ${error.message}`);
     });
   ```

## Purchase Requirements

As specified in your requirements:

1. **Required Information**:
   - Name
   - Shipping address (format: "Name, Street, City, State ZIP, Country")
   - Email
   - Payment method: USDC
   - Preferred chain: Base

2. **Product Locator Format**: 'amazon:B08SVZ775L'

3. **No Pre-purchase Balance Check**: The code doesn't check the wallet balance before purchase

4. **Auto-complete Purchase**: The purchase is automatically completed after the `buy_token` execution

## License

MIT
