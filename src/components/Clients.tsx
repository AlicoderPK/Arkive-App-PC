import React, { useState, useRef } from 'react';
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
  XSquare
} from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { exportService } from '../services/export';
import { Client, ClientAccessRequest } from '../types';

interface ClientsProps {
  showForm?: boolean;
  onCloseForm?: () => void;
}

export function Clients({ showForm: externalShowForm, onCloseForm }: ClientsProps) {
  const { 
    clients, 
    createClient, 
    updateClient, 
    deleteClient, 
    receipts, 
    getReceiptsByClient,
    clientAccessRequests,
    createClientAccessRequest,
    updateClientAccessRequest,
    loading 
  } = useDatabase();
  const { user, isAdmin } = useAuth();
  
  const [showForm, setShowForm] = useState(externalShowForm || false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientReceipts, setClientReceipts] = useState<any[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    password: '',
    type: 'Other' as 'IRIS' | 'SECP' | 'PRA' | 'Other',
    phone: '',
    email: '',
    notes: ''
  });

  React.useEffect(() => {
    if (externalShowForm !== undefined) {
      setShowForm(externalShowForm);
    }
  }, [externalShowForm]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnic: '',
      password: '',
      type: 'Other',
      phone: '',
      email: '',
      notes: ''
    });
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{13}$/.test(formData.cnic)) {
      showMessage('CNIC must be exactly 13 digits', 'error');
      return;
    }

    try {
      if (editingClient) {
        const updatedClient = {
          ...editingClient,
          ...formData,
          updatedAt: new Date()
        };
        await updateClient(updatedClient);
        showMessage('Client updated successfully!', 'success');
      } else {
        await createClient({
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showMessage('Client created successfully!', 'success');
      }

      resetForm();
      setShowForm(false);
      if (onCloseForm) {
        onCloseForm();
      }
    } catch (error) {
      console.error('Error saving client:', error);
      showMessage('Error saving client. Please try again.', 'error');
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      cnic: client.cnic,
      password: client.password,
      type: client.type,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || ''
    });
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete client "${name}"?`)) {
      try {
        await deleteClient(id);
        showMessage('Client deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting client:', error);
        showMessage('Error deleting client', 'error');
      }
    }
  };

  const handleViewMore = async (client: Client) => {
    setSelectedClient(client);
    try {
      const receipts = await getReceiptsByClient(client.cnic);
      setClientReceipts(receipts);
    } catch (error) {
      console.error('Error fetching client receipts:', error);
      setClientReceipts([]);
    }
    setShowDetails(true);
  };

  const handleRequestAccess = async (client: Client) => {
    if (!accessReason.trim()) {
      showMessage('Please provide a reason for accessing client credentials', 'error');
      return;
    }

    try {
      await createClientAccessRequest({
        employeeId: user!.id,
        employeeName: user!.username,
        clientId: client.id,
        clientName: client.name,
        clientCnic: client.cnic,
        reason: accessReason,
        status: 'pending'
      });

      setShowAccessRequest(false);
      setAccessReason('');
      showMessage('Access request submitted successfully! Admin will review it.', 'success');
    } catch (error) {
      console.error('Error creating access request:', error);
      showMessage('Error submitting access request', 'error');
    }
  };

  const handleViewCredentials = async (client: Client) => {
    if (!isAdmin) {
      // Check if employee has approved access
      const myRequests = clientAccessRequests.filter(req => 
        req.employeeId === user!.id && 
        req.clientId === client.id && 
        req.status === 'approved' &&
        (!req.expiresAt || new Date() < req.expiresAt)
      );

      if (myRequests.length === 0) {
        setSelectedClient(client);
        setShowAccessRequest(true);
        return;
      }
    }

    // Admin or approved employee can view credentials
    setSelectedClient(client);
    setShowCredentials(true);

    // Log credential access
    try {
      await db.createActivity({
        userId: user!.id,
        action: 'view_client_credentials',
        details: `${user!.username} viewed credentials for client: ${client.name} (${client.cnic})`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging credential access:', error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExport = async () => {
    try {
      await exportService.exportClientsToExcel(clients);
      showMessage('Clients exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('Error exporting clients', 'error');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cnic.includes(searchTerm) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || client.type === filterType;

    return matchesSearch && matchesType;
  });

  // Get pending requests for current user (if employee)
  const myPendingRequests = clientAccessRequests.filter(req => 
    req.employeeId === user!.id && req.status === 'pending'
  );

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
            Client Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage client profiles and access credentials • {clients.length} total clients
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105"
              >
                <Download size={20} />
                Export
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              >
                <Plus size={20} />
                Add Client
              </button>
            </>
          )}
        </div>
      </div>

      {/* Employee Access Status */}
      {!isAdmin && myPendingRequests.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <span className="text-yellow-700 dark:text-yellow-300 font-medium">
              You have {myPendingRequests.length} pending access request(s) awaiting admin approval
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Total Clients</p>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{clients.length}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 shadow-xl border-2 border-green-200 dark:border-green-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">IRIS Clients</p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                {clients.filter(c => c.type === 'IRIS').length}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">SECP Clients</p>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {clients.filter(c => c.type === 'SECP').length}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-6 shadow-xl border-2 border-orange-200 dark:border-orange-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">This Month</p>
              <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                {clients.filter(c => 
                  format(c.createdAt, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                ).length}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, CNIC, phone, or email..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 shadow-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 shadow-sm font-medium"
          >
            <option value="">All Types</option>
            <option value="IRIS">IRIS</option>
            <option value="SECP">SECP</option>
            <option value="PRA">PRA</option>
            <option value="Other">Other</option>
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
            <Users className="w-4 h-4 mr-2" />
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px] hover:shadow-3xl transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full premium-table">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  CNIC
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Credentials
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client, index) => {
                const hasApprovedAccess = !isAdmin && clientAccessRequests.some(req => 
                  req.employeeId === user!.id && 
                  req.clientId === client.id && 
                  req.status === 'approved' &&
                  (!req.expiresAt || new Date() < req.expiresAt)
                );

                const hasPendingRequest = !isAdmin && clientAccessRequests.some(req => 
                  req.employeeId === user!.id && 
                  req.clientId === client.id && 
                  req.status === 'pending'
                );

                return (
                  <tr key={client.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-lg stagger-item" style={{ animationDelay: `${index * 100}ms` }}>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-bold">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Created {format(client.createdAt, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900 dark:text-white font-mono font-bold">
                      {client.cnic}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold shadow-sm ${
                        client.type === 'IRIS' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        client.type === 'SECP' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                        client.type === 'PRA' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                      }`}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          onClick={() => handleViewCredentials(client)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                        >
                          <Key className="w-4 h-4" />
                          View
                        </button>
                      ) : hasApprovedAccess ? (
                        <button
                          onClick={() => handleViewCredentials(client)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                        >
                          <Unlock className="w-4 h-4" />
                          Access
                        </button>
                      ) : hasPendingRequest ? (
                        <span className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm font-medium shadow-sm animate-pulse">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowAccessRequest(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
                        >
                          <Lock className="w-4 h-4" />
                          Request
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewMore(client)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-md"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(client)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105 shadow-md"
                              title="Edit Client"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id, client.name)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-md"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-gentle-bounce">
              <Users className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No clients found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
              {clients.length === 0 
                ? "Create your first client to get started" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
              >
                <Plus size={20} />
                Add Client
              </button>
            )}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showForm && isAdmin && (
        <div className="form-modal">
          <div className="form-container animate-slideInRight">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              {editingClient ? 'Edit Client' : 'New Client'}
            </h2>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNIC *
                  </label>
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                      setFormData({ ...formData, cnic: value });
                    }}
                    placeholder="Enter 13-digit CNIC"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    maxLength={13}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter client password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                    required
                  >
                    <option value="IRIS">IRIS</option>
                    <option value="SECP">SECP</option>
                    <option value="PRA">PRA</option>
                    <option value="Other">Other</option>
                  </select>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the client"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                  if (onCloseForm) {
                    onCloseForm();
                  }
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                {editingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Request Modal */}
      {showAccessRequest && selectedClient && (
        <div className="form-modal">
          <div className="form-container animate-slideInRight">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                Request Client Access
              </h2>
              <button
                onClick={() => {
                  setShowAccessRequest(false);
                  setAccessReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                Requesting access to credentials for:
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm">
                <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedClient.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">CNIC: {selectedClient.cnic}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Reason for Access *
              </label>
              <textarea
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                placeholder="Please explain why you need access to this client's credentials..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 shadow-sm"
                required
              />
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl mb-6 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                <Shield className="w-3 h-3 inline mr-1" />
                Your request will be sent to administrators for approval. All access is logged for security.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAccessRequest(false);
                  setAccessReason('');
                }}
                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-300 font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestAccess(selectedClient)}
                disabled={!accessReason.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-filter backdrop-blur-sm bg-black bg-opacity-70">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md animate-slideInRight">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Client Credentials
              </h2>
              <button
                onClick={() => setShowCredentials(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                <div className="flex items-center text-red-700 dark:text-red-300">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Confidential Information</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  This access is being logged for security purposes
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name
                  </label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-medium">{selectedClient.name}</span>
                    <button
                      onClick={() => copyToClipboard(selectedClient.name, 'name')}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'name' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNIC
                  </label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-mono">{selectedClient.cnic}</span>
                    <button
                      onClick={() => copyToClipboard(selectedClient.cnic, 'cnic')}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'cnic' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-900 dark:text-white font-mono">{selectedClient.password}</span>
                    <button
                      onClick={() => copyToClipboard(selectedClient.password, 'password')}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedField === 'password' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-900 dark:text-white">{selectedClient.type}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowCredentials(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showDetails && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-filter backdrop-blur-sm bg-black bg-opacity-70">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Client Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{selectedClient.type} Client</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">CNIC:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{selectedClient.cnic}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                        <span className="text-gray-900 dark:text-white">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white">{selectedClient.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {format(selectedClient.createdAt, 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  {selectedClient.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedClient.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment History</h4>
                  
                  {clientReceipts.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {clientReceipts.map((receipt) => (
                        <div key={receipt.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                PKR {receipt.amount.toLocaleString('en-PK')}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {receipt.natureOfWork}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {format(receipt.date, 'MMM dd, yyyy')} • {receipt.paymentMethod.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
                    </div>
                  )}

                  {clientReceipts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                          <p className="text-lg font-bold text-green-600">
                            PKR {clientReceipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-PK')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receipts</p>
                          <p className="text-lg font-bold text-blue-600">{clientReceipts.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                          <p className="text-lg font-bold text-purple-600">
                            PKR {clientReceipts.length > 0 ? Math.round(clientReceipts.reduce((sum, r) => sum + r.amount, 0) / clientReceipts.length).toLocaleString('en-PK') : 0}
                          </p>
                        </div>
                      </div>
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
}