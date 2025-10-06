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

// Dynamic GraphQL query builder
function buildOrdersQuery(options = {}) {
    const {
        first = 50,
        after = null,
        createdAtMin = null,
        createdAtMax = null,
        financialStatus = null,
        fulfillmentStatus = null,
        sortKey = 'CREATED_AT',
        reverse = true
    } = options;

    // Build query variables
    let queryArgs = [`first: ${first}`];
    
    if (after) queryArgs.push(`after: "${after}"`);
    
    // Build search query string for filters
    let queryFilters = [];
    if (createdAtMin && createdAtMax) {
        queryFilters.push(`created_at:>='${createdAtMin}' AND created_at:<='${createdAtMax}'`);
    } else if (createdAtMin) {
        queryFilters.push(`created_at:>='${createdAtMin}'`);
    } else if (createdAtMax) {
        queryFilters.push(`created_at:<='${createdAtMax}'`);
    }
    
    if (financialStatus) queryFilters.push(`financial_status:${financialStatus}`);
    if (fulfillmentStatus) queryFilters.push(`fulfillment_status:${fulfillmentStatus}`);
    
    if (queryFilters.length > 0) {
        queryArgs.push(`query: "${queryFilters.join(' AND ')}"`);
    }
    
    queryArgs.push(`sortKey: ${sortKey}`);
    queryArgs.push(`reverse: ${reverse}`);

    return `
    {
      orders(${queryArgs.join(', ')}) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
            lineItems(first: 10) {
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
}

// API Routes
async function fetchShopifyOrders(queryOptions = {}) {
    try {
        const query = buildOrdersQuery(queryOptions);
        
        const res = await fetch(SHOPIFY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": API_KEY
            },
            body: JSON.stringify({ query })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.errors) {
            console.error("GraphQL errors:", data.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const orders = data.data.orders.edges.map(o => ({
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

        return {
            orders,
            pageInfo: data.data.orders.pageInfo
        };
    } catch (error) {
        console.error("Error fetching Shopify orders:", error);
        throw error;
    }
}

// Fetch all orders with pagination (for large datasets)
async function fetchAllShopifyOrders(queryOptions = {}) {
    const allOrders = [];
    let hasNextPage = true;
    let after = null;
    let pageCount = 0;
    const maxPages = queryOptions.maxPages || 50; // Safety limit
    
    while (hasNextPage && pageCount < maxPages) {
        try {
            const result = await fetchShopifyOrders({
                ...queryOptions,
                after,
                first: queryOptions.first || 50
            });
            
            allOrders.push(...result.orders);
            hasNextPage = result.pageInfo.hasNextPage;
            after = result.pageInfo.endCursor;
            pageCount++;
            
            // Log progress for large datasets
            if (pageCount % 5 === 0) {
                console.log(`Fetched ${allOrders.length} orders (page ${pageCount})`);
            }
            
        } catch (error) {
            console.error(`Error on page ${pageCount}:`, error);
            break;
        }
    }
    
    console.log(`Total orders fetched: ${allOrders.length}`);
    return allOrders;
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

// Get orders data with flexible parameters
app.get('/api/orders', async (req, res) => {
    try {
        const {
            limit = 50,
            page = 1,
            all = false,
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            sortKey = 'CREATED_AT',
            reverse = 'true'
        } = req.query;

        const queryOptions = {
            first: parseInt(limit),
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            sortKey,
            reverse: reverse === 'true'
        };

        let orders;
        let pagination = null;

        if (all === 'true') {
            // Fetch all orders with pagination
            orders = await fetchAllShopifyOrders({
                ...queryOptions,
                maxPages: 100 // Safety limit for very large stores
            });
        } else {
            // Single page with pagination info
            const result = await fetchShopifyOrders(queryOptions);
            orders = result.orders;
            pagination = {
                hasNextPage: result.pageInfo.hasNextPage,
                endCursor: result.pageInfo.endCursor,
                currentPage: parseInt(page),
                totalFetched: orders.length
            };
        }

        res.json({ 
            success: true, 
            data: orders,
            pagination,
            total: orders.length
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download CSV with flexible parameters
app.get('/api/orders/csv', async (req, res) => {
    try {
        const {
            all = 'true', // Default to all orders for CSV export
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            sortKey = 'CREATED_AT',
            reverse = 'true'
        } = req.query;

        const queryOptions = {
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            sortKey,
            reverse: reverse === 'true'
        };

        let orders;
        if (all === 'true') {
            orders = await fetchAllShopifyOrders({
                ...queryOptions,
                maxPages: 200 // Higher limit for CSV export
            });
        } else {
            const result = await fetchShopifyOrders(queryOptions);
            orders = result.orders;
        }

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

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: "Shopify Orders API Documentation",
        version: "2.0.0",
        endpoints: {
            "/api/orders": {
                method: "GET",
                description: "Fetch Shopify orders with flexible filtering and pagination",
                parameters: {
                    limit: {
                        type: "number",
                        default: 50,
                        max: 250,
                        description: "Number of orders per page"
                    },
                    all: {
                        type: "boolean",
                        default: false,
                        description: "Fetch all orders (ignores pagination, may take time)"
                    },
                    createdAtMin: {
                        type: "string",
                        format: "ISO 8601 (2024-01-01T00:00:00Z)",
                        description: "Filter orders created after this date"
                    },
                    createdAtMax: {
                        type: "string", 
                        format: "ISO 8601 (2024-12-31T23:59:59Z)",
                        description: "Filter orders created before this date"
                    },
                    financialStatus: {
                        type: "string",
                        options: ["pending", "authorized", "partially_paid", "paid", "partially_refunded", "refunded", "voided"],
                        description: "Filter by payment status"
                    },
                    fulfillmentStatus: {
                        type: "string",
                        options: ["unfulfilled", "partial", "fulfilled", "restocked"],
                        description: "Filter by fulfillment status"
                    },
                    sortKey: {
                        type: "string",
                        default: "CREATED_AT",
                        options: ["CREATED_AT", "UPDATED_AT", "ORDER_NUMBER", "TOTAL_PRICE"],
                        description: "Sort orders by field"
                    },
                    reverse: {
                        type: "boolean",
                        default: true,
                        description: "Sort in descending order"
                    }
                },
                examples: {
                    "Recent orders": "/api/orders?limit=25",
                    "All paid orders": "/api/orders?all=true&financialStatus=paid", 
                    "Orders from date range": "/api/orders?createdAtMin=2024-01-01T00:00:00Z&createdAtMax=2024-01-31T23:59:59Z",
                    "Unfulfilled orders": "/api/orders?fulfillmentStatus=unfulfilled&limit=100"
                }
            },
            "/api/orders/csv": {
                method: "GET",
                description: "Export orders as CSV file",
                parameters: "Same as /api/orders (defaults to all=true)",
                note: "Downloads CSV file directly"
            }
        },
        limits: {
            "Max records per request": "250 (for single page)",
            "Max pages for all=true": "200 (configurable)",
            "Rate limits": "Shopify API limits apply",
            "Timeout": "30 seconds for large exports"
        }
    });
});

// Batch processing endpoint for very large datasets
app.post('/api/orders/batch', async (req, res) => {
    try {
        const {
            batchSize = 100,
            maxBatches = 50,
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            callback_url // Optional webhook for completion notification
        } = req.body;

        const batchId = Date.now().toString();
        
        // Start batch processing in background
        processBatch(batchId, {
            batchSize,
            maxBatches,
            createdAtMin,
            createdAtMax,
            financialStatus,
            fulfillmentStatus,
            callback_url
        });

        res.json({
            success: true,
            batchId,
            message: "Batch processing started",
            estimatedTime: `${Math.ceil(maxBatches * 2)} seconds`,
            status_endpoint: `/api/orders/batch/${batchId}/status`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Batch status tracking
const batchStatus = new Map();

async function processBatch(batchId, options) {
    batchStatus.set(batchId, {
        status: 'processing',
        processed: 0,
        total: 0,
        startTime: new Date(),
        error: null
    });

    try {
        const orders = await fetchAllShopifyOrders({
            first: options.batchSize,
            maxPages: options.maxBatches,
            createdAtMin: options.createdAtMin,
            createdAtMax: options.createdAtMax,
            financialStatus: options.financialStatus,
            fulfillmentStatus: options.fulfillmentStatus
        });

        batchStatus.set(batchId, {
            status: 'completed',
            processed: orders.length,
            total: orders.length,
            startTime: batchStatus.get(batchId).startTime,
            completedTime: new Date(),
            data: orders.slice(0, 1000), // Return sample for status check
            error: null
        });

        // Optional: Send webhook notification
        if (options.callback_url) {
            // Implementation would go here
            console.log(`Batch ${batchId} completed, would notify ${options.callback_url}`);
        }

    } catch (error) {
        batchStatus.set(batchId, {
            status: 'failed',
            processed: 0,
            total: 0,
            startTime: batchStatus.get(batchId).startTime,
            error: error.message
        });
    }
}

// Get batch status
app.get('/api/orders/batch/:batchId/status', (req, res) => {
    const { batchId } = req.params;
    const status = batchStatus.get(batchId);
    
    if (!status) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    res.json({ success: true, batchId, ...status });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
