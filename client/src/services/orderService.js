import axios from 'axios'

class OrderService {
  constructor() {
    this.baseURL = '/api'
    this.batchStatuses = new Map() // Track batch processing
  }

  /**
   * Fetch orders with flexible filtering and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise} API response with orders data
   */
  async fetchOrders(filters = {}) {
    try {
      // Clean up empty filter values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      const params = new URLSearchParams(cleanFilters)
      const response = await axios.get(`${this.baseURL}/orders?${params}`)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch orders')
      }

      return {
        success: true,
        orders: response.data.data || [],
        pagination: response.data.pagination,
        total: response.data.total || 0,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch orders')
    }
  }

  /**
   * Export orders as CSV with filtering
   * @param {Object} filters - Filter parameters  
   * @returns {Promise} Blob for download
   */
  async exportCSV(filters = {}) {
    try {
      // Default to all orders for CSV export unless specified
      const exportFilters = { all: true, ...filters }
      
      const cleanFilters = Object.entries(exportFilters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      const params = new URLSearchParams(cleanFilters)
      const response = await axios.get(`${this.baseURL}/orders/csv?${params}`, {
        responseType: 'blob'
      })

      return {
        success: true,
        blob: response.data,
        filename: this.generateCSVFilename(filters)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to export CSV')
    }
  }

  /**
   * Start batch processing for very large datasets
   * @param {Object} options - Batch processing options
   * @returns {Promise} Batch ID and status info
   */
  async startBatch(options = {}) {
    try {
      const batchOptions = {
        batchSize: 100,
        maxBatches: 50,
        ...options
      }

      const response = await axios.post(`${this.baseURL}/orders/batch`, batchOptions)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start batch processing')
      }

      const batchId = response.data.batchId
      
      // Track batch status locally
      this.batchStatuses.set(batchId, {
        status: 'processing',
        startTime: new Date(),
        options: batchOptions
      })

      return {
        success: true,
        batchId,
        estimatedTime: response.data.estimatedTime,
        statusEndpoint: response.data.status_endpoint,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error starting batch:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to start batch processing')
    }
  }

  /**
   * Check batch processing status
   * @param {string} batchId - Batch identifier
   * @returns {Promise} Current batch status
   */
  async checkBatchStatus(batchId) {
    try {
      const response = await axios.get(`${this.baseURL}/orders/batch/${batchId}/status`)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get batch status')
      }

      // Update local tracking
      this.batchStatuses.set(batchId, {
        ...this.batchStatuses.get(batchId),
        ...response.data,
        lastChecked: new Date()
      })

      return {
        success: true,
        batchId: response.data.batchId,
        status: response.data.status,
        processed: response.data.processed || 0,
        total: response.data.total || 0,
        startTime: response.data.startTime,
        completedTime: response.data.completedTime,
        error: response.data.error,
        data: response.data.data // Sample data for completed batches
      }
    } catch (error) {
      console.error('Error checking batch status:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to check batch status')
    }
  }

  /**
   * Get API documentation
   * @returns {Promise} API documentation
   */
  async getDocumentation() {
    try {
      const response = await axios.get(`${this.baseURL}/docs`)
      return {
        success: true,
        documentation: response.data
      }
    } catch (error) {
      console.error('Error fetching API docs:', error)
      throw new Error('Failed to fetch API documentation')
    }
  }

  /**
   * Check server health
   * @returns {Promise} Health status
   */
  async checkHealth() {
    try {
      const response = await axios.get('/health')
      return {
        success: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version
      }
    } catch (error) {
      console.error('Health check failed:', error)
      throw new Error('Server health check failed')
    }
  }

  /**
   * Generate CSV filename with timestamp and filters
   * @param {Object} filters - Applied filters
   * @returns {string} Generated filename
   */
  generateCSVFilename(filters = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    let suffix = ''

    if (filters.financialStatus) {
      suffix += `-${filters.financialStatus}`
    }
    if (filters.fulfillmentStatus) {
      suffix += `-${filters.fulfillmentStatus}`
    }
    if (filters.createdAtMin && filters.createdAtMax) {
      const startDate = new Date(filters.createdAtMin).toISOString().split('T')[0]
      const endDate = new Date(filters.createdAtMax).toISOString().split('T')[0]
      suffix += `-${startDate}_to_${endDate}`
    }

    return `shopify-orders-${timestamp}${suffix}.csv`
  }

  /**
   * Download blob as file
   * @param {Blob} blob - File blob
   * @param {string} filename - Download filename
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Get all active batch processes
   * @returns {Array} List of active batches
   */
  getActiveBatches() {
    return Array.from(this.batchStatuses.entries()).map(([id, status]) => ({
      id,
      ...status
    }))
  }

  /**
   * Clear completed batches from tracking
   */
  clearCompletedBatches() {
    for (const [batchId, status] of this.batchStatuses.entries()) {
      if (status.status === 'completed' || status.status === 'failed') {
        this.batchStatuses.delete(batchId)
      }
    }
  }

  /**
   * Format filter parameters for display
   * @param {Object} filters - Filter object
   * @returns {string} Human-readable filter description
   */
  formatFiltersDescription(filters) {
    const parts = []
    
    if (filters.all) {
      parts.push('All orders')
    } else if (filters.limit) {
      parts.push(`${filters.limit} orders`)
    }
    
    if (filters.financialStatus) {
      parts.push(`${filters.financialStatus} payments`)
    }
    
    if (filters.fulfillmentStatus) {
      parts.push(`${filters.fulfillmentStatus} orders`)
    }
    
    if (filters.createdAtMin && filters.createdAtMax) {
      const start = new Date(filters.createdAtMin).toLocaleDateString()
      const end = new Date(filters.createdAtMax).toLocaleDateString()
      parts.push(`from ${start} to ${end}`)
    } else if (filters.createdAtMin) {
      const start = new Date(filters.createdAtMin).toLocaleDateString()
      parts.push(`from ${start}`)
    } else if (filters.createdAtMax) {
      const end = new Date(filters.createdAtMax).toLocaleDateString()
      parts.push(`until ${end}`)
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No filters applied'
  }
}

// Create singleton instance
const orderService = new OrderService()

export default orderService