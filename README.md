# Shopify to Sheets

A full-stack web application for exporting Shopify orders to CSV format.

## Features

- Fetch recent Shopify orders via GraphQL API
- Display orders summary in a clean web interface
- Export orders data to CSV format
- Full-stack deployment ready for Render

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **APIs**: Shopify Admin API (GraphQL)

## Local Development

### Prerequisites

- Node.js (version 16+)
- Shopify Admin API access token

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Shopify credentials:
   ```
   SHOP_DOMAIN=your-shop-name.myshopify.com
   SHOP_TOKEN=your_shopify_admin_api_token
   PORT=5000
   ```

3. Install all dependencies:
   ```bash
   npm run install:all
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- React dev server on `http://localhost:5173`
- Express server on `http://localhost:5000`

## Production Build

```bash
npm run build
npm start
```

## Deployment to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
4. Add environment variables:
   - `SHOP_DOMAIN`: Your Shopify domain
   - `SHOP_TOKEN`: Your Shopify Admin API token

## API Endpoints

- `GET /api/orders` - Fetch orders data
- `GET /api/orders/csv` - Download orders as CSV

## Environment Variables

- `SHOP_DOMAIN`: Your Shopify store domain
- `SHOP_TOKEN`: Shopify Admin API access token
- `PORT`: Server port (default: 5000)