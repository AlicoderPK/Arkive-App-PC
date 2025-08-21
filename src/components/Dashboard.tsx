import React from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Plus,
  Receipt,
  FileText,
  Shield,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onPageChange: (page: string) => void;
  onOpenForm: (formType: 'receipt' | 'client' | 'expense' | 'vault') => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Dashboard: React.FC<DashboardProps> = ({ onPageChange, onOpenForm }) => {
  const { 
    receipts, 
    expenses, 
    clients, 
    documents, 
    employees,
    receiptsLoading, 
    expensesLoading, 
    clientsLoading 
  } = useDatabase();
  
  const { user } = useAuth();

  // Calculate real-time statistics
  const totalRevenue = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeClients = clients.length;
  const totalDocuments = documents.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;

  // Monthly data for charts
  const monthlyData = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthReceipts = receipts.filter(r => 
        r.date >= monthStart && r.date <= monthEnd
      );
      const monthExpenses = expenses.filter(e => 
        e.date >= monthStart && e.date <= monthEnd
      );
      
      const revenue = monthReceipts.reduce((sum, r) => sum + r.amount, 0);
      const expense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      months.push({
        month: format(monthDate, 'MMM'),
        revenue,
        expense,
        profit: revenue - expense
      });
    }
    return months;
  }, [receipts, expenses]);

  // Recent receipts (last 5)
  const recentReceipts = receipts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Payment method distribution
  const paymentMethodData = React.useMemo(() => {
    const methods = receipts.reduce((acc, receipt) => {
      const method = receipt.paymentMethod.replace('_', ' ');
      acc[method] = (acc[method] || 0) + receipt.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: ((value / totalRevenue) * 100).toFixed(1)
    }));
  }, [receipts, totalRevenue]);

  // This month vs last month comparison
  const thisMonth = receipts.filter(r => 
    format(r.date, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  ).reduce((sum, r) => sum + r.amount, 0);

  const lastMonth = receipts.filter(r => 
    format(r.date, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM')
  ).reduce((sum, r) => sum + r.amount, 0);

  const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  if (receiptsLoading || expensesLoading || clientsLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
            Here's your business overview for today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(new Date(), 'HH:mm')}
          </p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[200px] stagger-item hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign size={32} className="text-white" />
            </div>
            <div className="text-right">
              <div className="flex items-center text-blue-100">
                {monthlyGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span className="text-sm ml-1">{Math.abs(monthlyGrowth).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-blue-100 text-lg font-medium">TOTAL REVENUE</p>
            <p className="text-4xl font-bold mt-2">PKR {totalRevenue.toLocaleString('en-PK')}</p>
            <p className="text-blue-100 text-base mt-2">{receipts.length} receipts</p>
            <button 
              onClick={() => onPageChange('receipts')}
              className="text-blue-100 text-sm mt-3 flex items-center hover:text-white transition-colors group"
            >
              <TrendingUp size={16} className="mr-1 group-hover:scale-110 transition-transform" />
              View all receipts
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[200px] stagger-item hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CreditCard size={32} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-red-100 text-lg font-medium">TOTAL EXPENSES</p>
            <p className="text-4xl font-bold mt-2">PKR {totalExpenses.toLocaleString('en-PK')}</p>
            <p className="text-red-100 text-base mt-2">{expenses.length} entries</p>
            <button 
              onClick={() => onPageChange('expenses')}
              className="text-red-100 text-sm mt-3 flex items-center hover:text-white transition-colors group"
            >
              <CreditCard size={16} className="mr-1 group-hover:scale-110 transition-transform" />
              Manage expenses
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[200px] stagger-item hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users size={32} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-green-100 text-lg font-medium">ACTIVE CLIENTS</p>
            <p className="text-4xl font-bold mt-2">{activeClients}</p>
            <p className="text-green-100 text-base mt-2">total clients</p>
            <button 
              onClick={() => onPageChange('clients')}
              className="text-green-100 text-sm mt-3 flex items-center hover:text-white transition-colors group"
            >
              <Users size={16} className="mr-1 group-hover:scale-110 transition-transform" />
              View all clients
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[200px] stagger-item hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity size={32} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-purple-100 text-lg font-medium">EMPLOYEES</p>
            <p className="text-4xl font-bold mt-2">{activeEmployees}</p>
            <p className="text-purple-100 text-base mt-2">active staff</p>
            <button 
              onClick={() => onPageChange('employees')}
              className="text-purple-100 text-sm mt-3 flex items-center hover:text-white transition-colors group"
            >
              <Activity size={16} className="mr-1 group-hover:scale-110 transition-transform" />
              Manage staff
            </button>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-gentle-bounce">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Net Profit</h3>
            <p className="text-5xl font-bold mb-3">PKR {netProfit.toLocaleString('en-PK')}</p>
            <p className="text-green-100 text-lg">
              Profit Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <TrendingUp className="w-12 h-12 text-green-100" />
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Revenue Trend Chart */}
        <div className="chart-container min-h-[450px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            6-Month Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => `${(value / 1000)}K`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `PKR ${value.toLocaleString('en-PK')}`, 
                  name === 'revenue' ? 'Revenue' : name === 'expense' ? 'Expenses' : 'Profit'
                ]}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="chart-container min-h-[450px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-purple-600" />
            Payment Methods
          </h3>
          {paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => 
                    parseFloat(percentage) > 5 ? `${name}: ${percentage}%` : ''
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `PKR ${value.toLocaleString('en-PK')} (${props.payload.percentage}%)`, 
                    'Amount'
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No payment data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 min-h-[250px]">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Show attendance button for employees */}
          {user?.role === 'employee' && (
            <button 
              onClick={() => onPageChange('attendance')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/40 dark:hover:to-purple-700/40 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                  <Clock className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">Mark Attendance</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track your time</p>
                </div>
              </div>
            </button>
          )}
          
          {user?.role === 'admin' && (
            <button 
              onClick={() => onPageChange('employees')}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/40 dark:hover:to-indigo-700/40 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                  <Target className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">Assign Tasks</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage team tasks</p>
                </div>
              </div>
            </button>
          )}

          <button 
            onClick={() => onOpenForm('receipt')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                <Receipt className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Add Receipt</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Record new payment</p>
              </div>
            </div>
          </button>

          {user?.role === 'admin' && (
            <button 
            onClick={() => onOpenForm('client')}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/40 dark:hover:to-green-700/40 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                <Users className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Add Client</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">New client profile</p>
              </div>
            </div>
            </button>
          )}

          <button 
            onClick={() => onOpenForm('expense')}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/40 dark:hover:to-red-700/40 border-2 border-red-200 dark:border-red-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <div className="flex items-center mb-4">
              <div className="bg-red-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                <CreditCard className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Add Expense</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Record expense</p>
              </div>
            </div>
          </button>

          {user?.role === 'admin' && (
            <button 
            onClick={() => onOpenForm('vault')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/40 dark:hover:to-purple-700/40 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">Upload Document</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Secure vault</p>
              </div>
            </div>
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Receipts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              Recent Receipts
            </h3>
            <button 
              onClick={() => onPageChange('receipts')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 group"
            >
              View All 
              <ArrowUpRight size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
          <div className="space-y-4">
            {recentReceipts.length > 0 ? recentReceipts.map((receipt, index) => (
              <div key={receipt.id} className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 stagger-item`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{receipt.clientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(receipt.date, 'MMM dd, yyyy - hh:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                    PKR {receipt.amount.toLocaleString('en-PK')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {receipt.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No receipts yet</p>
                <button 
                  onClick={() => onOpenForm('receipt')}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Create First Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 min-h-[500px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" />
            System Overview
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Documents</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalDocuments}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">This Month</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {receipts.filter(r => 
                        format(r.date, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                      ).length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Firebase Connection</span>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Connected</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Last Sync</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {format(new Date(), 'hh:mm a')}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Pending Changes</span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 text-sm font-semibold">0 items</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Business Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Receipt:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    PKR {receipts.length > 0 ? Math.round(totalRevenue / receipts.length).toLocaleString('en-PK') : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Revenue:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    PKR {thisMonth.toLocaleString('en-PK')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
                  <span className={`font-bold ${monthlyGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;