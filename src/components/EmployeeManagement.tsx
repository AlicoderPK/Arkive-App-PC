import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Users, 
  Phone, 
  Mail, 
  CreditCard,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  User,
  Key,
  Lock,
  Unlock,
  FileText,
  Calendar,
  CheckSquare,
  XSquare,
  Target,
  Send,
  MessageSquare,
  Star,
  Filter,
  UserPlus,
  Building,
  DollarSign,
  Award,
  TrendingUp,
  Activity,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { useDatabase } from '../hooks/useDatabase';
import { useAuth } from '../contexts/AuthContext';
import { Employee, Task } from '../types';
import { db } from '../services/database';

const EmployeeManagement: React.FC = () => {
  const { 
    employees, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    tasks,
    createTask,
    updateTask,
    deleteTask,
    getTasksByEmployee,
    getTasksByAssigner,
    clientAccessRequests,
    updateClientAccessRequest,
    loading 
  } = useDatabase();
  
  const { user, isAdmin } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'tasks' | 'requests'>('employees');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    joinDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as 'active' | 'inactive' | 'terminated',
    username: '',
    password: '',
    role: 'employee' as 'employee' | 'manager'
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: ''
  });

  useEffect(() => {
    if (user?.role === 'employee') {
      loadMyTasks();
    } else if (isAdmin) {
      loadAssignedTasks();
    }
  }, [user, isAdmin]);

  const loadMyTasks = async () => {
    if (user?.id) {
      try {
        const tasks = await getTasksByEmployee(user.id);
        setMyTasks(tasks);
      } catch (error) {
        console.error('Error loading my tasks:', error);
      }
    }
  };

  const loadAssignedTasks = async () => {
    if (user?.id) {
      try {
        const tasks = await getTasksByAssigner(user.id);
        setAssignedTasks(tasks);
      } catch (error) {
        console.error('Error loading assigned tasks:', error);
      }
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      joinDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'active',
      username: '',
      password: '',
      role: 'employee'
    });
    setEditingEmployee(null);
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: ''
    });
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.salary && isNaN(Number(formData.salary))) {
      showMessage('Salary must be a valid number', 'error');
      return;
    }

    try {
      if (editingEmployee) {
        const updatedEmployee = {
          ...editingEmployee,
          ...formData,
          salary: Number(formData.salary) || 0,
          joinDate: new Date(formData.joinDate),
          updatedAt: new Date()
        };
        await updateEmployee(updatedEmployee);
        showMessage('Employee updated successfully!', 'success');
      } else {
        // Generate employee ID if not provided
        const employeeId = formData.employeeId || `EMP${Date.now()}`;
        
        await createEmployee({
          ...formData,
          employeeId,
          salary: Number(formData.salary) || 0,
          joinDate: new Date(formData.joinDate),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showMessage('Employee created successfully!', 'success');
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      showMessage('Error saving employee. Please try again.', 'error');
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTask) {
        const updatedTask = {
          ...editingTask,
          ...taskFormData,
          dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
          updatedAt: new Date()
        };
        await updateTask(updatedTask);
        showMessage('Task updated successfully!', 'success');
        loadAssignedTasks();
      } else {
        await createTask({
          ...taskFormData,
          assignedBy: user!.id,
          dueDate: taskFormData.dueDate ? new Date(taskFormData.dueDate) : undefined,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showMessage('Task assigned successfully!', 'success');
        loadAssignedTasks();
      }

      resetTaskForm();
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      showMessage('Error saving task. Please try again.', 'error');
    }
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary.toString(),
      joinDate: format(employee.joinDate, 'yyyy-MM-dd'),
      status: employee.status,
      username: employee.username,
      password: employee.password,
      role: employee.role
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
      try {
        await deleteEmployee(id);
        showMessage('Employee deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting employee:', error);
        showMessage('Error deleting employee', 'error');
      }
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete task "${title}"?`)) {
      try {
        await deleteTask(id);
        showMessage('Task deleted successfully!', 'success');
        loadAssignedTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Error deleting task', 'error');
      }
    }
  };

  const handleViewMore = async (employee: Employee) => {
    setSelectedEmployee(employee);
    try {
      const tasks = await getTasksByEmployee(employee.id);
      setEmployeeTasks(tasks);
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
      setEmployeeTasks([]);
    }
    setShowDetails(true);
  };

  const handleApproveRequest = async (request: any) => {
    try {
      const updatedRequest = {
        ...request,
        status: 'approved',
        respondedAt: new Date(),
        respondedBy: user!.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      await updateClientAccessRequest(updatedRequest);
      showMessage('Access request approved!', 'success');
    } catch (error) {
      console.error('Error approving request:', error);
      showMessage('Error approving request', 'error');
    }
  };

  const handleDenyRequest = async (request: any) => {
    try {
      const updatedRequest = {
        ...request,
        status: 'denied',
        respondedAt: new Date(),
        respondedBy: user!.id
      };
      
      await updateClientAccessRequest(updatedRequest);
      showMessage('Access request denied!', 'success');
    } catch (error) {
      console.error('Error denying request:', error);
      showMessage('Error denying request', 'error');
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: string) => {
    try {
      const updatedTask = { 
        ...task, 
        status: newStatus,
        updatedAt: new Date(),
        completedAt: newStatus === 'completed' ? new Date() : undefined
      };
      await updateTask(updatedTask);
      
      if (user?.role === 'employee') {
        loadMyTasks();
      } else {
        loadAssignedTasks();
      }
      
      // Log activity
      await db.createActivity({
        userId: user!.id,
        action: 'update_task_status',
        details: `Updated task "${task.title}" status to ${newStatus}`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      showMessage('Error updating task status', 'error');
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || employee.status === filterStatus;
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'terminated': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  // Calculate stats
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalSalary = employees.filter(emp => emp.status === 'active').reduce((sum, emp) => sum + emp.salary, 0);
  const avgSalary = activeEmployees > 0 ? totalSalary / activeEmployees : 0;

  // Task stats
  const totalTasks = isAdmin ? assignedTasks.length : myTasks.length;
  const completedTasks = isAdmin ? 
    assignedTasks.filter(task => task.status === 'completed').length :
    myTasks.filter(task => task.status === 'completed').length;
  const pendingTasks = isAdmin ?
    assignedTasks.filter(task => task.status === 'pending').length :
    myTasks.filter(task => task.status === 'pending').length;

  // Access requests stats (admin only)
  const pendingRequests = clientAccessRequests.filter(req => req.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        } animate-slideInRight`}>
          <div className="flex items-center">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            {user?.role === 'employee' ? 'My Tasks & Profile' : 'Employee Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user?.role === 'employee' 
              ? 'View your assigned tasks and profile information'
              : `Manage staff, assign tasks, and handle access requests • ${employees.length} employees`
            }
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105"
            >
              <Target size={20} />
              Assign Task
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
            >
              <Plus size={20} />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {user?.role === 'employee' ? 'My Tasks' : 'Active Employees'}
              </p>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {user?.role === 'employee' ? myTasks.length : activeEmployees}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              {user?.role === 'employee' ? <Target className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 shadow-xl border-2 border-green-200 dark:border-green-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                {user?.role === 'employee' ? 'Completed' : 'Total Salary'}
              </p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                {user?.role === 'employee' 
                  ? myTasks.filter(task => task.status === 'completed').length
                  : `PKR ${totalSalary.toLocaleString('en-PK')}`
                }
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              {user?.role === 'employee' ? <CheckCircle className="w-8 h-8 text-white" /> : <DollarSign className="w-8 h-8 text-white" />}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {user?.role === 'employee' ? 'In Progress' : 'Departments'}
              </p>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {user?.role === 'employee' 
                  ? myTasks.filter(task => task.status === 'in_progress').length
                  : departments.length
                }
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              {user?.role === 'employee' ? <Clock className="w-8 h-8 text-white" /> : <Building className="w-8 h-8 text-white" />}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-6 shadow-xl border-2 border-orange-200 dark:border-orange-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                {user?.role === 'employee' ? 'Pending' : isAdmin ? 'Access Requests' : 'Average Salary'}
              </p>
              <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                {user?.role === 'employee' 
                  ? myTasks.filter(task => task.status === 'pending').length
                  : isAdmin 
                    ? pendingRequests
                    : `PKR ${Math.round(avgSalary).toLocaleString('en-PK')}`
                }
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              {user?.role === 'employee' ? <Clock className="w-8 h-8 text-white" /> : isAdmin ? <Shield className="w-8 h-8 text-white" /> : <TrendingUp className="w-8 h-8 text-white" />}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Employees ({employees.length})</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>
                {user?.role === 'employee' ? `My Tasks (${myTasks.length})` : `Assigned Tasks (${assignedTasks.length})`}
              </span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Access Requests ({pendingRequests})</span>
                {pendingRequests > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                    {pendingRequests}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Employees Tab */}
          {activeTab === 'employees' && isAdmin && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="w-4 h-4 mr-2" />
                  Showing {filteredEmployees.length} of {employees.length}
                </div>
              </div>

              {/* Employees Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees.map((employee, index) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 stagger-item" style={{ animationDelay: `${index * 100}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {employee.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                          {employee.employeeId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          PKR {employee.salary.toLocaleString('en-PK')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewMore(employee)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              title="Edit Employee"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id, employee.name)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete Employee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {employees.length === 0 
                      ? "Add your first employee to get started" 
                      : "Try adjusting your search or filter criteria"
                    }
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    Add Employee
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.role === 'employee' ? 'My Assigned Tasks' : 'Tasks I Assigned'}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={20} />
                    Assign New Task
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(user?.role === 'employee' ? myTasks : assignedTasks).map((task) => {
                  const assignedEmployee = employees.find(emp => emp.id === task.assignedTo);
                  
                  return (
                    <div key={task.id} className={`p-6 rounded-xl border transition-all duration-200 ${
                      task.status === 'completed' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {user?.role === 'employee' && (
                            <button
                              onClick={() => {
                                if (task.status === 'completed') {
                                  handleTaskStatusChange(task, 'pending');
                                } else if (task.status === 'pending') {
                                  handleTaskStatusChange(task, 'in_progress');
                                } else {
                                  handleTaskStatusChange(task, 'completed');
                                }
                              }}
                              className="mt-1 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {task.status === 'completed' ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <XSquare className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${
                              task.status === 'completed' 
                                ? 'text-green-700 dark:text-green-300 line-through' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {task.title}
                            </h3>
                            <p className={`text-sm mt-1 ${
                              task.status === 'completed' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                              </span>
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(task.dueDate, 'MMM dd, yyyy')}
                                </span>
                              )}
                              {user?.role === 'admin' && assignedEmployee && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {assignedEmployee.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              title="Edit Task"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {(user?.role === 'employee' ? myTasks : assignedTasks).length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {user?.role === 'employee' ? 'No tasks assigned' : 'No tasks created'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {user?.role === 'employee' 
                        ? 'Tasks assigned by your manager will appear here'
                        : 'Create your first task to assign to employees'
                      }
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setShowTaskForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus size={20} />
                        Assign Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Requests Tab */}
          {activeTab === 'requests' && isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Client Access Requests
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingRequests} pending requests
                </div>
              </div>

              <div className="space-y-4">
                {clientAccessRequests.map((request) => (
                  <div key={request.id} className={`p-6 rounded-xl border transition-all duration-200 ${
                    request.status === 'pending' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                      : request.status === 'approved'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Access Request for {request.clientName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Requested by {request.employeeName} • CNIC: {request.clientCnic}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">Reason:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.reason}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Requested: {format(request.requestedAt, 'MMM dd, yyyy hh:mm a')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            request.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDenyRequest(request)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={16} />
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {clientAccessRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No access requests</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Employee requests for client credential access will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && isAdmin && (
        <div className="form-modal">
          <div className="form-container animate-slideInRight">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {editingEmployee ? 'Edit Employee' : 'New Employee'}
            </h2>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g., Tax Consultant"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Tax Services"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Salary
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData({ ...formData, salary: value ? parseInt(value).toLocaleString() : '' });
                      }}
                      placeholder="Enter monthly salary"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Join Date *
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Login username"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Login password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && isAdmin && (
        <div className="form-modal">
          <div className="form-container animate-slideInRight">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              {editingTask ? 'Edit Task' : 'Assign New Task'}
            </h2>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="Enter task title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    placeholder="Describe the task in detail..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign To *
                  </label>
                  <select
                    value={taskFormData.assignedTo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.filter(emp => emp.status === 'active').map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority *
                    </label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetTaskForm();
                  setShowTaskForm(false);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTaskSubmit}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showDetails && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-filter backdrop-blur-sm bg-black bg-opacity-70">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Employee Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedEmployee.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{selectedEmployee.position}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Employee ID:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{selectedEmployee.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Department:</span>
                      <span className="text-gray-900 dark:text-white">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-900 dark:text-white">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                      <span className="text-gray-900 dark:text-white">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Salary:</span>
                      <span className="text-gray-900 dark:text-white">PKR {selectedEmployee.salary.toLocaleString('en-PK')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Join Date:</span>
                      <span className="text-gray-900 dark:text-white">
                        {format(selectedEmployee.joinDate, 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmployee.status)}`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assigned Tasks</h4>
                  
                  {employeeTasks.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {employeeTasks.map((task) => (
                        <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">{task.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Due: {format(task.dueDate, 'MMM dd')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No tasks assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;