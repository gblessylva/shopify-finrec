const DashboardStats = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const totalRevenue = data.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const totalOrders = data.length;
  const totalItems = data.reduce((sum, order) => sum + order.line_items.length, 0);
  
  const paidOrders = data.filter(order => order.financial_status?.toLowerCase() === 'paid').length;
  const fulfilledOrders = data.filter(order => order.fulfillment_status?.toLowerCase() === 'fulfilled').length;
  
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const currency = data[0]?.currency || 'CAD';

  const stats = [
    {
      title: 'Total Revenue',
      value: `${currency} ${totalRevenue.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Average Order Value',
      value: `${currency} ${averageOrderValue.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Total Items Sold',
      value: totalItems.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-indigo-600',
      bg: 'bg-indigo-100'
    },
    {
      title: 'Paid Orders',
      value: `${paidOrders}/${totalOrders}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Fulfilled Orders',
      value: `${fulfilledOrders}/${totalOrders}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bg}`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500 truncate">
                {stat.title}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;