import { useState } from 'react'

const OrderFilters = ({ onFiltersChange, loading, currentFilters = {} }) => {
  const [filters, setFilters] = useState({
    all: false,
    limit: 50,
    createdAtMin: '',
    createdAtMax: '',
    financialStatus: '',
    fulfillmentStatus: '',
    sortKey: 'CREATED_AT',
    reverse: true,
    ...currentFilters
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Predefined date ranges
  const dateRanges = {
    today: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return { start: today, end: new Date() }
    },
    yesterday: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const endYesterday = new Date(yesterday)
      endYesterday.setHours(23, 59, 59, 999)
      return { start: yesterday, end: endYesterday }
    },
    last7days: () => {
      const start = new Date()
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    },
    last30days: () => {
      const start = new Date()
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      return { start, end: new Date() }
    },
    thisMonth: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end: new Date() }
    },
    lastMonth: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return { start, end }
    }
  }

  const financialStatusOptions = [
    { value: '', label: 'All Financial Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'voided', label: 'Voided' }
  ]

  const fulfillmentStatusOptions = [
    { value: '', label: 'All Fulfillment Status' },
    { value: 'unfulfilled', label: 'Unfulfilled' },
    { value: 'partial', label: 'Partially Fulfilled' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'restocked', label: 'Restocked' }
  ]

  const sortOptions = [
    { value: 'CREATED_AT', label: 'Created Date' },
    { value: 'UPDATED_AT', label: 'Updated Date' },
    { value: 'ORDER_NUMBER', label: 'Order Number' },
    { value: 'TOTAL_PRICE', label: 'Total Price' }
  ]

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateRangeSelect = (rangeKey) => {
    const range = dateRanges[rangeKey]()
    const newFilters = {
      ...filters,
      createdAtMin: range.start.toISOString(),
      createdAtMax: range.end.toISOString()
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      all: false,
      limit: 50,
      createdAtMin: '',
      createdAtMax: '',
      financialStatus: '',
      fulfillmentStatus: '',
      sortKey: 'CREATED_AT',
      reverse: true
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().slice(0, 16)
  }

  const parseDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString()
  }

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'limit' && value === 50) return false
    if (key === 'sortKey' && value === 'CREATED_AT') return false
    if (key === 'reverse' && value === true) return false
    if (key === 'all' && value === false) return false
    return value !== '' && value !== false && value !== null
  }).length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shopify-100 text-shopify-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            <svg 
              className={`ml-1 w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Fetch Mode Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="fetchAll"
            checked={filters.all}
            onChange={(e) => handleFilterChange('all', e.target.checked)}
            className="rounded border-gray-300 text-shopify-600 focus:ring-shopify-500"
          />
          <label htmlFor="fetchAll" className="text-sm font-medium text-gray-700">
            Fetch All Orders
          </label>
          <div className="group relative">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
              May take time for large stores
            </div>
          </div>
        </div>

        {/* Records Limit */}
        {!filters.all && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Records per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
            >
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={250}>250 records</option>
            </select>
          </div>
        )}

        {/* Financial Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Financial Status
          </label>
          <select
            value={filters.financialStatus}
            onChange={(e) => handleFilterChange('financialStatus', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
          >
            {financialStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Fulfillment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fulfillment Status
          </label>
          <select
            value={filters.fulfillmentStatus}
            onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
          >
            {fulfillmentStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Date Ranges */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Date Ranges
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(dateRanges).map((key) => (
            <button
              key={key}
              onClick={() => handleDateRangeSelect(key)}
              disabled={loading}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-shopify-500 disabled:opacity-50"
            >
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="datetime-local"
                value={formatDate(filters.createdAtMin)}
                onChange={(e) => handleFilterChange('createdAtMin', parseDate(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="datetime-local"
                value={formatDate(filters.createdAtMax)}
                onChange={(e) => handleFilterChange('createdAtMax', parseDate(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortKey}
                  onChange={(e) => handleFilterChange('sortKey', e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-shopify-500 focus:ring-shopify-500 text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleFilterChange('reverse', !filters.reverse)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filters.reverse 
                      ? 'bg-shopify-100 text-shopify-800 border border-shopify-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                  title={filters.reverse ? 'Descending' : 'Ascending'}
                >
                  {filters.reverse ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderFilters