import { useState } from 'react';
import PropTypes from 'prop-types';

const FinancialTable = ({ data, onExport, loading, pagination, filters }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState(new Set([
    'order_id', 'created_at', 'customer_name', 'product_title', 
    'product_quantity', 'product_customer_sub_brand', 'total', 'financial_status', 'fulfillment_status'
  ]));

  // Define all available columns
  const allColumns = [
    { key: 'order_id', label: 'Order ID', width: 'min-w-[120px]' },
    { key: 'created_at', label: 'Date', width: 'min-w-[110px]' },
    { key: 'customer_name', label: 'Customer', width: 'min-w-[180px]' },
    { key: 'customer_email', label: 'Email', width: 'min-w-[200px]' },
    { key: 'customer_address', label: 'Customer Address', width: 'min-w-[250px]' },
    { key: 'billing_address', label: 'Billing Address', width: 'min-w-[250px]' },
    { key: 'product_title', label: 'Product', width: 'min-w-[200px]' },
    { key: 'product_quantity', label: 'Qty', width: 'min-w-[60px]' },
    { key: 'product_collection', label: 'Collection', width: 'min-w-[120px]' },
    { key: 'product_sub_brand', label: 'Sub Brand', width: 'min-w-[120px]' },
    { key: 'product_customer_sub_brand', label: 'Customer Sub Brand', width: 'min-w-[150px]' },
    { key: 'total', label: 'Total', width: 'min-w-[100px]' },
    { key: 'financial_status', label: 'Payment', width: 'min-w-[110px]' },
    { key: 'fulfillment_status', label: 'Fulfillment', width: 'min-w-[110px]' },
    { key: 'shipping_line_title', label: 'Shipping Method', width: 'min-w-[150px]' },
    { key: 'shipping_line_price', label: 'Shipping Cost', width: 'min-w-[120px]' }
  ];
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No financial records</h3>
        <p className="text-gray-500">Get started by fetching your Shopify orders</p>
      </div>
    );
  }

  // Get flattened data for table display
  const tableData = data.flatMap(order => 
    order.line_items.map(item => ({
      order_id: order.order_id,
      created_at: new Date(order.created_at).toLocaleDateString(),
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total: parseFloat(order.total).toFixed(2),
      currency: order.currency,
      customer_name: order.customer_name || 'N/A',
      customer_email: order.customer_email || 'N/A',
      customer_address: order.customer_address || 'N/A',
      billing_address: order.billing_address || 'N/A',
      product_title: item.title,
      product_quantity: item.quantity,
      product_collection: item.collection || 'N/A',
      product_sub_brand: item.sub_brand || 'N/A',
      product_customer_sub_brand: item.customer_sub_brand || 'No Customer Sub-Brand',
      shipping_line_title: order.shipping_line ? order.shipping_line.title : 'N/A',
      shipping_line_price: order.shipping_line ? parseFloat(order.shipping_line.price).toFixed(2) : '0.00'
    }))
  );

  // Pagination logic
  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = tableData.slice(startIndex, endIndex);

  const toggleRowSelection = (index) => {
    const newSelection = new Set(selectedRows);
    const actualIndex = startIndex + index; // Adjust for pagination
    if (newSelection.has(actualIndex)) {
      newSelection.delete(actualIndex);
    } else {
      newSelection.add(actualIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === currentItems.length) {
      setSelectedRows(new Set());
    } else {
      const currentPageIndices = currentItems.map((_, i) => startIndex + i);
      setSelectedRows(new Set(currentPageIndices));
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey);
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRows(new Set()); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedRows(new Set());
  };

  const getStatusBadge = (status) => {
    const baseClasses = "status-badge";
    switch (status?.toLowerCase()) {
      case 'paid':
        return `${baseClasses} status-paid`;
      case 'pending':
        return `${baseClasses} status-pending`;
      case 'fulfilled':
        return `${baseClasses} status-fulfilled`;
      default:
        return `${baseClasses} status-unfulfilled`;
    }
  };

  const renderCellContent = (row, columnKey) => {
    switch (columnKey) {
      case 'order_id':
        return <span className="font-medium text-shopify-600">{row.order_id}</span>;
      case 'created_at':
        return <span className="text-gray-500">{row.created_at}</span>;
      case 'customer_name':
        return (
          <div>
            <div className="font-medium text-gray-900">{row.customer_name}</div>
            {visibleColumns.has('customer_email') ? null : (
              <div className="text-gray-500 text-xs">{row.customer_email}</div>
            )}
          </div>
        );
      case 'customer_email':
        return <span className="text-gray-500 text-sm">{row.customer_email}</span>;
      case 'customer_address':
        return <span className="text-sm text-gray-600" title={row.customer_address}>{row.customer_address}</span>;
      case 'billing_address':
        return <span className="text-sm text-gray-600" title={row.billing_address}>{row.billing_address}</span>;
      case 'product_title':
        return <span title={row.product_title}>{row.product_title}</span>;
      case 'product_quantity':
        return row.product_quantity;
      case 'product_collection':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {row.product_collection}
          </span>
        );
      case 'product_sub_brand':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {row.product_sub_brand}
          </span>
        );
      case 'product_customer_sub_brand': {
        // Handle different customer sub-brand values with appropriate styling
        const customerSubBrand = row.product_customer_sub_brand;
        let badgeClass = "inline-flex px-2 py-1 text-xs font-medium rounded-full";
        
        if (customerSubBrand === 'No Customer Sub-Brand' || customerSubBrand === 'N/A') {
          badgeClass += " bg-gray-100 text-gray-600";
        } else if (customerSubBrand.startsWith('[') && customerSubBrand.endsWith(']')) {
          // JSON array format - show as fallback data
          badgeClass += " bg-orange-100 text-orange-700 border border-orange-200";
        } else {
          // Actual customer selection
          badgeClass += " bg-green-100 text-green-800 border border-green-200";
        }
        
        return (
          <span className={badgeClass} title={customerSubBrand}>
            {customerSubBrand}
          </span>
        );
      }
      case 'total':
        return <span className="font-semibold">{row.currency} {row.total}</span>;
      case 'financial_status':
        return <span className={getStatusBadge(row.financial_status)}>{row.financial_status}</span>;
      case 'fulfillment_status':
        return <span className={getStatusBadge(row.fulfillment_status)}>{row.fulfillment_status}</span>;
      case 'shipping_line_title':
        return <span className="text-gray-600">{row.shipping_line_title}</span>;
      case 'shipping_line_price':
        return <span className="text-gray-500">{row.currency} {row.shipping_line_price}</span>;
      default:
        return row[columnKey] || 'N/A';
    }
  };

  return (
    <div className="bg-white shadow-shopify rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Table Header - Fixed */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Financial Records</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} records from {data.length} order{data.length !== 1 ? 's' : ''}
              {visibleColumns.size > 8 && (
                <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Table scrolls horizontally
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            {/* Items per page selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-shopify-500 focus:border-shopify-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Column visibility dropdown */}
            <div className="relative group">
              <button className="btn btn-secondary text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                Columns ({visibleColumns.size})
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Show/Hide Columns</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allColumns.map((column) => (
                      <label key={column.key} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.key)}
                          onChange={() => toggleColumnVisibility(column.key)}
                          className="h-4 w-4 text-shopify-600 focus:ring-shopify-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedRows.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedRows.size} selected
              </span>
            )}
            
            <button
              onClick={onExport}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container - Only this scrolls horizontally */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 table-scroll">
        <div className="min-w-full h-full overflow-y-auto">
          <table className="w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentItems.length && currentItems.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-shopify-600 focus:ring-shopify-500 border-gray-300 rounded"
                  />
                </th>
                {allColumns.filter(col => visibleColumns.has(col.key)).map((column) => (
                  <th key={column.key} className={`table-header ${column.width}`}>
                    <div className="whitespace-nowrap">
                      {column.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((row, index) => {
                const actualIndex = startIndex + index;
                const isSelected = selectedRows.has(actualIndex);
                return (
                  <tr
                    key={`${row.order_id}-${actualIndex}`}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-shopify-50' : ''}`}
                  >
                    <td className="table-cell w-12">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(index)}
                        className="h-4 w-4 text-shopify-600 focus:ring-shopify-500 border-gray-300 rounded"
                      />
                    </td>
                    {allColumns.filter(col => visibleColumns.has(col.key)).map((column) => (
                      <td key={column.key} className={`table-cell ${column.width}`}>
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {renderCellContent(row, column.key)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-shopify-600 text-white border-shopify-600'
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Footer with Summary */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-6">
            <div>
              Total Revenue: <span className="font-semibold text-gray-900">
                {data.length > 0 ? data[0].currency : 'CAD'} {
                  data.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)
                }
              </span>
            </div>
            
            {/* Pagination Info */}
            {pagination && (
              <div className="text-xs">
                <span className="font-medium">Page Data:</span> {tableData.length} records
                {pagination.hasNextPage && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    More available
                  </span>
                )}
              </div>
            )}
            
            {/* Filter Info */}
            {filters?.all && (
              <div className="text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  All Records
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {selectedRows.size > 0 && (
              <span>{selectedRows.size} record{selectedRows.size !== 1 ? 's' : ''} selected</span>
            )}
            
            {/* Enhanced Export Info */}
            <div className="text-xs">
              Showing {currentItems.length} of {tableData.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
FinancialTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    order_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    financial_status: PropTypes.string,
    fulfillment_status: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    customer_name: PropTypes.string,
    customer_email: PropTypes.string,
    customer_address: PropTypes.string,
    billing_address: PropTypes.string,
    shipping_line: PropTypes.shape({
      title: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    line_items: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      quantity: PropTypes.number,
      collection: PropTypes.string,
      sub_brand: PropTypes.string,
      customer_sub_brand: PropTypes.string
    }))
  })).isRequired,
  onExport: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    hasNextPage: PropTypes.bool,
    endCursor: PropTypes.string,
    currentPage: PropTypes.number,
    totalFetched: PropTypes.number
  }),
  filters: PropTypes.shape({
    all: PropTypes.bool,
    limit: PropTypes.number,
    createdAtMin: PropTypes.string,
    createdAtMax: PropTypes.string,
    financialStatus: PropTypes.string,
    fulfillmentStatus: PropTypes.string,
    sortKey: PropTypes.string,
    reverse: PropTypes.bool
  })
};

export default FinancialTable;