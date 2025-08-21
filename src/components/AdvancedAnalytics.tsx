import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const AdvancedAnalytics: React.FC = () => {
  const { receipts, expenses, clients, employees } = useDatabase();

  // Calculate real statistics
  const totalRevenue = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeClients = clients.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;

  // Monthly revenue data
  const revenueData = React.useMemo(() => {
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
        expenses: expense,
        profit: revenue - expense
      });
    }
    return months;
  }, [receipts, expenses]);

  // Client type distribution
  const clientTypeData = React.useMemo(() => {
    const types = clients.reduce((acc, client) => {
      acc[client.type] = (acc[client.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types).map(([name, value]) => ({
      name,
      value,
      color: COLORS[Object.keys(types).indexOf(name) % COLORS.length]
    }));
  }, [clients]);

  // Growth calculations
  const thisMonth = receipts.filter(r => 
    format(r.date, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  ).reduce((sum, r) => sum + r.amount, 0);

  const lastMonth = receipts.filter(r => 
    format(r.date, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM')
  ).reduce((sum, r) => sum + r.amount, 0);

  const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // Expense category breakdown
  const expenseCategoryData = React.useMemo(() => {
    const categories = expenses.reduce((acc, expense) => {
      const category = expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : '0'
    }));
  }, [expenses, totalExpenses]);

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {format(new Date(), 'MMM dd, yyyy')}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(new Date(), 'hh:mm a')}
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white min-h-[180px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-base">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">PKR {totalRevenue.toLocaleString('en-PK')}</p>
              <p className="text-blue-100 text-sm mt-1">
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
              </p>
            </div>
            <DollarSign size={32} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white min-h-[180px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-base">Net Profit</p>
              <p className="text-3xl font-bold mt-2">PKR {netProfit.toLocaleString('en-PK')}</p>
              <p className="text-green-100 text-sm mt-1">
                {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}% profit margin
              </p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white min-h-[180px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-base">Active Clients</p>
              <p className="text-3xl font-bold mt-2">{activeClients}</p>
              <p className="text-purple-100 text-sm mt-1">{clients.length} total clients</p>
            </div>
            <Users size={32} className="text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white min-h-[180px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-base">Avg. Receipt Value</p>
              <p className="text-3xl font-bold mt-2">
                PKR {receipts.length > 0 ? Math.round(totalRevenue / receipts.length).toLocaleString('en-PK') : 0}
              </p>
              <p className="text-orange-100 text-sm mt-1">{receipts.length} total receipts</p>
            </div>
            <Calendar size={32} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[500px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Revenue vs Expenses Trend
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData}>
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
                  name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                ]}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[500px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Profit Analysis
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
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
                formatter={(value: number) => [`PKR ${value.toLocaleString('en-PK')}`, 'Profit']}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10B981" 
                strokeWidth={3} 
                name="Profit"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Client Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[400px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-purple-600" />
            Client Type Distribution
          </h3>
          {clientTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Clients']}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No client data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[400px]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-600" />
            Expense Categories
          </h3>
          {expenseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategoryData}
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
                  {expenseCategoryData.map((entry, index) => (
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
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Business Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-indigo-100 text-sm">Revenue Growth</p>
            <p className="text-2xl font-bold">
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-indigo-100 text-sm">Profit Margin</p>
            <p className="text-2xl font-bold">
              {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-indigo-100 text-sm">Avg Client Value</p>
            <p className="text-2xl font-bold">
              PKR {activeClients > 0 ? Math.round(totalRevenue / activeClients).toLocaleString('en-PK') : 0}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-indigo-100 text-sm">Employee Cost</p>
            <p className="text-2xl font-bold">
              PKR {employees.reduce((sum, emp) => sum + (emp.salary || 0), 0).toLocaleString('en-PK')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;