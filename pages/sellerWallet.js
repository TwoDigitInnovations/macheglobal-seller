import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Api } from '../services/service';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, DollarSign, CreditCard, History, Package, User, MapPin, ShoppingCart } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SellerWalletDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // State for wallet data
    const [walletData, setWalletData] = useState({
        balance: 0,
        totalEarnings: 0,
        pendingWithdrawals: 0,
        thisMonthEarnings: 0
    });

    const [recentTransactions, setRecentTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'HTG 0';
        return `HTG ${amount.toLocaleString()}`;
    };

    // Fetch seller wallet data
    const fetchWalletData = async () => {
        try {
            setLoading(true);
            // Get seller ID from logged-in user or local storage
            const user = JSON.parse(localStorage.getItem('userDetail') || '{}');
            const sellerId = user._id;

            try {
                // Fetch wallet data
                const walletRes = await Api('get', `wallet/seller/${sellerId}`, {}, router);
                if (walletRes?.data) {
                    setWalletData({
                        balance: walletRes.data.balance || 0,
                        totalEarnings: walletRes.data.totalEarnings || 0,
                        pendingWithdrawals: walletRes.data.pendingWithdrawals || 0,
                        thisMonthEarnings: walletRes.data.thisMonthEarnings || 0
                    });
                }
            } catch (error) {
                console.error('Error fetching wallet data:', error);
            }

            try {
                // Fetch wallet transactions for the seller
                const walletTransactionsRes = await Api('get', `wallet/transactions/seller/${sellerId}`, {}, router);
                const walletTransactions = Array.isArray(walletTransactionsRes) ? walletTransactionsRes :
                                        (Array.isArray(walletTransactionsRes?.data) ? walletTransactionsRes.data : []);
                
                // Fetch withdrawal history
                const withdrawalsRes = await Api('get', `wallet/seller/withdrawals/${sellerId}`, {}, router);
                const withdrawals = Array.isArray(withdrawalsRes) ? withdrawalsRes :
                                 (Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : []);
                
                // Process wallet transactions
                const processedWalletTransactions = walletTransactions.map(wt => ({
                    ...wt,
                    _id: wt._id || `wtx_${Math.random().toString(36).substr(2, 9)}`,
                    type: wt.type === 'credit' ? 'credit' : 'debit',
                    transactionType: wt.metadata?.transactionType || 'EARNING',
                    date: wt.createdAt || wt.date || new Date().toISOString()
                }));
                
                // Process withdrawals
                const processedWithdrawals = withdrawals.map(w => ({
                    ...w,
                    _id: w._id || `with_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'debit',
                    transactionType: 'WITHDRAWAL',
                    amount: w.amount,
                    description: w.remarks || 'Withdrawal request',
                    status: w.status,
                    date: w.requestedAt || w.createdAt || new Date().toISOString(),
                    metadata: {
                        transactionType: 'WITHDRAWAL'
                    }
                }));
                
                // Combine and sort all transactions by date (newest first)
                const allTransactions = [
                    ...processedWalletTransactions,
                    ...processedWithdrawals
                ].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                setRecentTransactions(allTransactions);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setRecentTransactions([]);
            }

            try {
                // Fetch withdrawal history using the correct endpoint for seller withdrawals
                const withdrawalsRes = await Api('get', `wallet/seller/withdrawals/${sellerId}`, {}, router);
                const withdrawalsData = Array.isArray(withdrawalsRes) ? withdrawalsRes : 
                                     (Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : []);
                setWithdrawals(withdrawalsData);
            } catch (error) {
                console.error('Error fetching withdrawals:', error);
                setWithdrawals([]);
            }

        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle withdrawal request
    const handleWithdrawal = async () => {
        if (!withdrawalAmount || isNaN(withdrawalAmount) || parseFloat(withdrawalAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            // Get user data from localStorage
            const user = JSON.parse(localStorage.getItem('userDetail') || '{}');
            if (!user || !user._id) {
                throw new Error('User not authenticated');
            }

            const sellerId = user._id;
            const sellerName = user.name || 'Seller';
            
            console.log('User data:', user); // Debug log
            console.log('Seller ID:', sellerId); // Debug log
            console.log('Seller Name:', sellerName); // Debug log
            
            // Prepare the request data
            const requestData = {
                sellerId: sellerId,
                sellerName: sellerName,
                amount: parseFloat(withdrawalAmount),
                paymentMethod: 'bank_transfer',
                accountDetails: {
                    accountNumber: 'N/A',
                    bankName: 'N/A',
                    accountHolderName: sellerName
                }
            };
            
            console.log('Sending withdrawal request with data:', requestData); // Debug log
            
            // Make the API call
            console.log('Sending withdrawal request...');
            const response = await Api('post', 'wallet/withdraw', requestData, router);
            console.log('Withdrawal response:', response);

            // Check if response exists and has data
            if (response && response.data) {
                // If the backend returns a success status or the request was created successfully
                if (response.data.success || response.data._id) {
                    toast.success('Withdrawal request submitted successfully!', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                    });
                    setShowWithdrawalModal(false);
                    setWithdrawalAmount('');
                    fetchWalletData(); // Refresh wallet data
                } else {
                    // If the backend returns an error message
                    throw new Error(response.data.message || 'Failed to process withdrawal');
                }
            } else {
                // If the response format is unexpected
                throw new Error('Unexpected response from server');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            
            // Extract error message from different possible locations in the error object
            const errorMessage = 
                error.response?.data?.message || 
                error.message || 
                'An error occurred while processing your withdrawal';
                
            console.log('Full error object:', JSON.stringify(error, null, 2));
            
            // Show error toast
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
            
            // If this was a successful request but with an error message
            if (error.response?.data?.success === false) {
                // Still refresh the data in case the withdrawal was created
                fetchWalletData();
            }
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchWalletData();
    }, []);


  return (
    <div className="min-h-screen bg-gray-100" style={{ background: "linear-gradient(135deg, #FF70009950, #FF700020)" }}>
      <div className="container mx-auto px-4 py-6 max-h-[92vh] h-full overflow-y-auto pb-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-purple-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: "#FF700099" }}>
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Seller Wallet</h1>
                <p className="text-gray-600 text-sm md:text-base">Manage your earnings and withdrawals</p>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="w-full md:w-auto px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#FF700099" }}
              disabled={loading}
            >
              <ArrowUpRight className="w-5 h-5 inline mr-2" />
              {loading ? 'Loading...' : 'Withdraw Money'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Balance Card */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Current Balance</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {formatCurrency(walletData.balance)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Total Earnings</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {formatCurrency(walletData.totalEarnings)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {/* Pending Withdrawals Card */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Pending Withdrawals</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {formatCurrency(walletData.pendingWithdrawals)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>

          {/* This Month Card */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">This Month</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {formatCurrency(walletData.thisMonthEarnings)}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: "#FF70001A" }}>
              <CreditCard className="w-6 h-6" style={{ color: "#FF700099" }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-t-2xl transition-all duration-200 ${
                activeTab === "overview"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              style={{
                backgroundColor: activeTab === "overview" ? "#FF700099" : "transparent",
              }}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Transaction History
            </button>

            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-t-2xl transition-all duration-200 ${
                activeTab === "withdrawals"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              style={{
                backgroundColor: activeTab === "withdrawals" ? "#FF700099" : "transparent",
              }}
            >
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Withdrawal History
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Transaction History</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-xs text-gray-600">Earnings</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                      <span className="text-xs text-gray-600">Withdrawals</span>
                    </div>
                  </div>
                </div>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div 
                        key={transaction._id} 
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                          transaction.transactionType === 'SALE_EARNING' 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : transaction.transactionType === 'WITHDRAWAL'
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'credit' || transaction.type === 'CREDIT' 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}>
                            {transaction.type === 'credit' || transaction.type === 'CREDIT' ? (
                              <ArrowDownLeft className="w-5 h-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {transaction.transactionType === 'SALE_EARNING' 
                                    ? `Earnings from sale` 
                                    : transaction.description || 'Transaction'}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <p className="text-sm text-gray-600">
                                    {formatDate(transaction.date || transaction.createdAt)}
                                  </p>
                                  {transaction.transactionType === 'SALE_EARNING' && (
                                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                                      Sale
                                    </span>
                                  )}
                                  {transaction.transactionType === 'WITHDRAWAL' && (
                                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                                      Withdrawal
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-lg ${(transaction.type === 'credit' || transaction.type === 'CREDIT') ? 'text-green-600' : 'text-red-600'}`}>
                                  {(transaction.type === 'credit' || transaction.type === 'CREDIT') ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                  {transaction.status === 'COMPLETED' ? 'completed' : (transaction.status || 'completed').toLowerCase()}
                                </p>
                              </div>
                            </div>

                            {/* Product Details */}
                            {transaction.transactionType === 'SALE_EARNING' && transaction.productDetails && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-start gap-3">
                                  {transaction.productDetails.image ? (
                                    <img 
                                      src={transaction.productDetails.image} 
                                      alt={transaction.productDetails.name}
                                      className="w-16 h-16 object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{transaction.productDetails.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <span className="font-medium mr-1">Qty:</span>
                                        <span>{transaction.productDetails.quantity || 1}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-1">Price:</span>
                                        <span>{formatCurrency(transaction.productDetails.price || 0)}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-1">Total:</span>
                                        <span className="font-semibold text-green-600">
                                          {formatCurrency(transaction.productDetails.total || transaction.amount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Order Details */}
                            {transaction.transactionType === 'SALE_EARNING' && transaction.orderDetails && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                <div className="flex items-center text-blue-700 font-medium mb-2">
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Order #{transaction.orderDetails.orderNumber || transaction.orderId?.toString().substr(-6) || 'N/A'}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {transaction.orderDetails.customerName && (
                                    <div className="flex items-start">
                                      <User className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium text-gray-900">{transaction.orderDetails.customerName}</p>
                                        <p className="text-xs text-gray-500">Customer</p>
                                      </div>
                                    </div>
                                  )}
                                  {transaction.orderDetails.shippingAddress && (
                                    <div className="flex items-start">
                                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                                      <div>
                                        <p className="text-gray-900">
                                          {[transaction.orderDetails.shippingAddress.address, 
                                          transaction.orderDetails.shippingAddress.city,
                                          transaction.orderDetails.shippingAddress.postalCode,
                                          transaction.orderDetails.shippingAddress.country]
                                          .filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-xs text-gray-500">Shipping Address</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No transactions found</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Withdrawal History</h3>
                {withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-100">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Withdrawal Request #{withdrawal.referenceId || withdrawal._id.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(withdrawal.requestedAt || withdrawal.createdAt)}
                          </p>
                          {withdrawal.remarks && (
                            <p className="text-xs text-gray-500">{withdrawal.remarks}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-red-600">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {withdrawal.status === 'pending' && (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                          {withdrawal.status === 'approved' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {withdrawal.status === 'rejected' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-600 capitalize">
                            {withdrawal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No withdrawal history found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Withdraw Funds</h3>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalAmount('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    HTG
                  </span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-gray-700 pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(walletData.balance)}
                </p>
              </div>
              <button
                onClick={handleWithdrawal}
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > walletData.balance}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white ${
                  !withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > walletData.balance
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF700099] hover:bg-[#FF700099]'
                }`}
              >
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerWalletDashboard;