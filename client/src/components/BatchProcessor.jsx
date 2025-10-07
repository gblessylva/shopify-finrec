import { useState, useEffect } from 'react'
import orderService from '../services/orderService'

const BatchProcessor = ({ filters, onComplete, onCancel }) => {
  const [batchId, setBatchId] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [polling, setPolling] = useState(false)

  // Start batch processing
  const startBatch = async () => {
    try {
      setError(null)
      const result = await orderService.startBatch({
        batchSize: 100,
        maxBatches: 100,
        ...filters
      })
      
      setBatchId(result.batchId)
      setStatus({
        status: 'processing',
        processed: 0,
        total: 0,
        estimatedTime: result.estimatedTime
      })
      setPolling(true)
    } catch (err) {
      setError(err.message)
    }
  }

  // Poll batch status
  useEffect(() => {
    let interval
    
    if (polling && batchId) {
      interval = setInterval(async () => {
        try {
          const result = await orderService.checkBatchStatus(batchId)
          setStatus(result)
          
          if (result.status === 'completed' || result.status === 'failed') {
            setPolling(false)
            if (result.status === 'completed' && onComplete) {
              onComplete(result.data || [])
            }
            if (result.status === 'failed') {
              setError(result.error || 'Batch processing failed')
            }
          }
        } catch (err) {
          setError(err.message)
          setPolling(false)
        }
      }, 2000) // Check every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [polling, batchId, onComplete])

  const handleCancel = () => {
    setPolling(false)
    setBatchId(null)
    setStatus(null)
    setError(null)
    if (onCancel) onCancel()
  }

  const getProgressPercentage = () => {
    if (!status || !status.total) return 0
    return Math.round((status.processed / status.total) * 100)
  }

  const getStatusColor = () => {
    if (!status) return 'gray'
    switch (status.status) {
      case 'processing': return 'blue'
      case 'completed': return 'green'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  if (!batchId) {
    // Start batch form
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Large Dataset Detected</h3>
          <p className="mt-2 text-sm text-gray-500">
            This operation may take several minutes for stores with many orders. 
            We&apos;ll process your data in batches to ensure reliability.
          </p>
          <div className="mt-4 bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Batch Processing Details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Processes up to 10,000 orders (100 batches × 100 orders)</li>
              <li>• Automatic progress tracking and error recovery</li>
              <li>• Estimated time: 3-5 minutes for large stores</li>
              <li>• You can continue using the dashboard during processing</li>
            </ul>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={startBatch}
              className="btn btn-primary"
            >
              Start Batch Processing
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Processing status display
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-${getStatusColor()}-100`}>
          {status?.status === 'processing' && (
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {status?.status === 'completed' && (
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status?.status === 'failed' && (
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Batch Processing {status?.status === 'completed' ? 'Complete' : 'In Progress'}
        </h3>
        
        <p className="mt-2 text-sm text-gray-500">
          Batch ID: <code className="bg-gray-100 px-1 rounded">{batchId}</code>
        </p>

        {/* Progress Bar */}
        {status && status.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{status.processed} / {status.total} orders ({getProgressPercentage()}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${getStatusColor()}-600 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status?.status === 'processing' && (
          <p className="mt-4 text-sm text-gray-600">
            Processing orders in batches... This may take a few minutes.
          </p>
        )}

        {status?.status === 'completed' && (
          <div className="mt-4">
            <p className="text-sm text-green-700 font-medium">
              Successfully processed {status.processed} orders!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Data has been loaded into your dashboard.
            </p>
          </div>
        )}

        {status?.status === 'failed' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700 font-medium">Processing Failed</p>
            <p className="text-xs text-red-600 mt-1">
              {error || 'An error occurred during batch processing. Please try again.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          {status?.status === 'processing' && (
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel Processing
            </button>
          )}
          
          {(status?.status === 'completed' || status?.status === 'failed') && (
            <button
              onClick={handleCancel}
              className="btn btn-primary"
            >
              Close
            </button>
          )}
        </div>

        {/* Technical Details (collapsible) */}
        {status && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 bg-gray-50 rounded p-3 text-xs text-gray-600">
              <pre>{JSON.stringify(status, null, 2)}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

export default BatchProcessor