require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const { Parser } = require('json2csv');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

const SHOP_DOMAIN = process.env.SHOP_DOMAIN;
const API_KEY = process.env.SHOP_TOKEN;

const SHOPIFY_URL = `https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`;

const SHOPIFY_QUERY = `
{
  orders(first: 50,  sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        currentTotalPriceSet {
          shopMoney { amount currencyCode }
        }
        customer {
          firstName
          lastName
          email
          defaultAddress {
            address1
            city
            country
            zip
          }
        }
        shippingAddress {
          address1
          city
          province
          zip
          country
        }
        billingAddress {
          address1
          city
          province
          zip
          country
        }
        shippingLine {
          title
          originalPriceSet {
            shopMoney { amount currencyCode }
          }
        }
        lineItems(first: 5) {
          edges {
            node {
              title
              quantity
              product {
                collections(first: 1) {
                  edges {
                    node {
                      title
                    }
                  }
                }
                  metafield(namespace: "custom", key: "sub_brand") {
                    value
                    }
              }
            }
          }
        }
      }
    }
  }
}
`;

// API Routes
async function fetchShopifyOrders() {
    const res = await fetch(SHOPIFY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": API_KEY
        },
        body: JSON.stringify({ query: SHOPIFY_QUERY })
    });

    const data = await res.json();
    if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        return [];
    }
    return data.data.orders.edges.map(o => ({
        order_id: o.node.name,
        created_at: o.node.createdAt,
        financial_status: o.node.displayFinancialStatus,
        fulfillment_status: o.node.displayFulfillmentStatus,
        total: o.node.currentTotalPriceSet.shopMoney.amount,
        currency: o.node.currentTotalPriceSet.shopMoney.currencyCode,
        customer_name: `${o.node.customer?.firstName || ""} ${o.node.customer?.lastName || ""}`.trim(),
        customer_email: o.node.customer?.email || "",
        customer_address: o.node.customer?.defaultAddress
            ? `${o.node.customer.defaultAddress.address1}, ${o.node.customer.defaultAddress.city}, ${o.node.customer.defaultAddress.country}`
            : "",
        shipping_address: o.node.shippingAddress
            ? `${o.node.shippingAddress.address1}, ${o.node.shippingAddress.city}, ${o.node.shippingAddress.country}`
            : "",
        billing_address: o.node.billingAddress
            ? `${o.node.billingAddress.address1}, ${o.node.billingAddress.city}, ${o.node.billingAddress.country}`
            : "",
        shipping_line: o.node.shippingLine
            ? {
                title: o.node.shippingLine.title,
                price: o.node.shippingLine.originalPriceSet.shopMoney.amount,
                currency: o.node.shippingLine.originalPriceSet.shopMoney.currencyCode
            }
            : null,
        line_items: o.node.lineItems.edges.map(li => ({
            title: li.node.title,
            quantity: li.node.quantity,
            sub_brand: li.node.product?.metafield?.value || "No Sub-Brand",
            collection: li.node.product?.collections?.edges[0]?.node?.title || "No Collection"
        }))
    }));
}

function generateCSV(data) {
    const flattened = data.flatMap(order =>
        order.line_items.map(item => ({
            order_id: order.order_id,
            created_at: order.created_at,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            total: order.total,
            currency: order.currency,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_address: order.customer_address,
            shipping_address: order.shipping_address,
            billing_address: order.billing_address,
            shipping_line_title: order.shipping_line ? order.shipping_line.title : "",
            shipping_line_price: order.shipping_line ? order.shipping_line.price : "",
            shipping_line_currency: order.shipping_line ? order.shipping_line.currency : "",
            product_title: item.title,
            product_quantity: item.quantity,
            product_collection: item.collection,
            product_sub_brand: item.sub_brand
        }))
    );

    const parser = new Parser();
    return parser.parse(flattened);
}

// Get orders data
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await fetchShopifyOrders();
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download CSV
app.get('/api/orders/csv', async (req, res) => {
    try {
        const orders = await fetchShopifyOrders();
        const csv = generateCSV(orders);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `orders-${timestamp}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
