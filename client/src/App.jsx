import { useState } from 'react'
import axios from 'axios'
import './App.css'
import FinancialTable from './components/FinancialTable'
import DashboardStats from './components/DashboardStats'

function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/orders')
      if (response.data.success) {
        setOrders(response.data.data)
      } else {
        setError(response.data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = async () => {
    setExportLoading(true)
    try {
      const response = await axios.get('/api/orders/csv', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      link.setAttribute('download', `financial-records-${timestamp}.csv`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download CSV: ' + err.message)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-25 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Twinkle Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Height */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Page Header */}
          <div className="mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">Financial Records</h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and export your Shopify store&apos;s financial data
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex-shrink-0">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {orders.length > 0 ? (
              <>
                {/* Dashboard Stats */}
                <div className="flex-shrink-0 mb-6">
                  <DashboardStats data={orders} loading={loading} />
                </div>

                {/* Financial Table - Takes remaining space */}
                <div className="flex-1 min-h-0">
                  <FinancialTable 
                    data={orders} 
                    onExport={downloadCSV} 
                    loading={exportLoading}
                  />
                </div>
              </>
            ) : !loading ? (
              /* Get Started Message */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-shopify-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-shopify-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to your Financial Dashboard
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by fetching your latest Shopify orders to see detailed financial records and analytics.
                  </p>
                  <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ) : (
              /* Loading State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-shopify-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-500">Loading your financial data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
