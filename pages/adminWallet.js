import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, DollarSign, CreditCard, History, Users, ShoppingCart, Percent } from 'lucide-react';
import { useRouter } from 'next/router';
import { Api } from '../services/service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-toastify/dist/ReactToastify.css';

const AdminWalletDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
        const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [currentWithdrawal, setCurrentWithdrawal] = useState(null);
    const router = useRouter();

    // State for wallet data
    const [walletData, setWalletData] = useState({
        balance: 0,
        totalCommissionEarned: 0,
        totalPayoutsMade: 0,
        pendingWithdrawals: 0,
        thisMonthCommission: 0,
        activeSellers: 0
    });

    const [recentTransactions, setRecentTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [sellers, setSellers] = useState([]);

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'HTG 0';
        return `HTG ${amount.toLocaleString()}`;
    };

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

    // Fetch admin wallet data
    const fetchWalletData = async () => {
        try {
            setLoading(true);
            
           
            const walletRes = await Api('get', 'wallet/admin/balance', {}, router);
            
            console.log('Wallet Response:', walletRes);
            if (walletRes?.data) {
                setWalletData({
                    balance: walletRes.data.balance || 0,
                    totalCommissionEarned: walletRes.data.totalCommissionEarned || 0,
                    totalPayoutsMade: walletRes.data.totalPayoutsMade || 0,
                    pendingWithdrawals: walletRes.data.pendingWithdrawals || 0,
                    thisMonthCommission: walletRes.data.thisMonthCommission || 0,
                    activeSellers: walletRes.data.activeSellers || 0
                });
            }

            try {
                // Fetch transactions separately to handle errors gracefully
                const transactionsRes = await Api('get', 'wallet/transactions', {}, router);
                console.log('Transactions Response:', transactionsRes);
                const transactionsData = Array.isArray(transactionsRes) ? transactionsRes : 
                                      (Array.isArray(transactionsRes?.data) ? transactionsRes.data : []);
                setRecentTransactions(transactionsData);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setRecentTransactions([]);
            }

            try {
                // Fetch withdrawals
                const withdrawalsRes = await Api('get', 'wallet/admin/withdrawals', {}, router);
                console.log('Withdrawals Response:', withdrawalsRes);
                const withdrawalsData = Array.isArray(withdrawalsRes) ? withdrawalsRes : 
                                     (Array.isArray(withdrawalsRes?.data) ? withdrawalsRes.data : []);
                setWithdrawals(withdrawalsData);
            } catch (error) {
                console.error('Error fetching withdrawals:', error);
                setWithdrawals([]);
            }

            try {
                // Fetch active sellers
                const sellersRes = await Api('get', 'seller/active', {}, router);
                console.log('Sellers Response:', sellersRes);
                const sellersData = Array.isArray(sellersRes) ? sellersRes : 
                                 (Array.isArray(sellersRes?.data) ? sellersRes.data : []);
                setSellers(sellersData);
            } catch (error) {
                console.error('Error fetching sellers:', error);
                setSellers([]);
            }

        } catch (error) {
            console.error('Error in fetchWalletData:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    }
    // Handle withdrawal action (approve/reject)
    const handleWithdrawalAction = (id, action) => {
        console.log('handleWithdrawalAction called with:', { id, action });
        
        if (action === 'reject') {
            setCurrentWithdrawal(id);
            setShowRejectModal(true);
            return;
        }
        
        // For approve, process directly
        processWithdrawalAction(id, action);
    };

    // Handle rejection reason submission
    const handleRejectWithdrawal = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason for rejection');
            return;
        }
        
        setShowRejectModal(false);
        await processWithdrawalAction(currentWithdrawal, 'reject', rejectionReason);
        setRejectionReason('');
        setCurrentWithdrawal(null);
    };

    // Process withdrawal action (approve/reject)
    const processWithdrawalAction = async (id, action, remarks = '') => {
        console.log('Processing withdrawal action:', { id, action, remarks });
        if (!id) {
            const errorMsg = 'Invalid withdrawal ID: ' + id;
            console.error(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            setLoading(true);
            
            // Prepare request data
            const requestData = { withdrawalId: id };
            
            // Add remarks if rejecting
            if (action === 'reject') {
                requestData.remarks = remarks;
            }
            
            const url = `wallet/admin/withdrawals/${id}/${action}`;
            const body = requestData.remarks ? { remarks: requestData.remarks } : {};
            
            console.log('Making API call:', {
                method: 'PUT',
                url,
                body,
                withdrawalId: id,
                action
            });
            
            const response = await Api(
                'put', 
                url, 
                body, 
                router
            );
            
            console.log('API Response:', response);
            
            console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Response:`, response);
            
            const actionText = action === 'approve' ? 'approved' : 'rejected';
            
            // Check for both possible response structures
            if (response?.status || response?.success || response?.data?._id) {
                const successMessage = response?.data?.message || `Withdrawal ${actionText} successfully!`;
                toast.success(successMessage, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                fetchWalletData(); // Refresh data
            } else {
                throw new Error(response?.data?.message || response?.message || `Failed to ${action} withdrawal`);
            }
        } catch (error) {
            console.error(`Error ${action}ing withdrawal:`, error);
            
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               `Failed to ${action} withdrawal`;
            
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        } finally {
            setLoading(false);
        }
    };


    // Load data on component mount
    useEffect(() => {
        fetchWalletData();
    }, []);


    return (
        <>
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Enter Reason for Rejection</h3>
                        <textarea
                            className="w-full text-gray-700 p-2 border rounded mb-4 h-24"
                            placeholder="Enter reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            autoFocus
                            dir="ltr"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectWithdrawal}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <div className="min-h-screen bg-gray-100" style={{ background: 'linear-gradient(135deg, #FF70009950, #FF700020)' }}>
                <div className="container mx-auto md:px-4 px-2 md:py-8 py-4 max-h-[92vh] h-full overflow-y-scroll scrollbar-hide overflow-scroll md:pb-10 pb-5">

                <div className="bg-white rounded-2xl shadow-xl md:p-8 p-4 md:mb-8 mb-4 border border-purple-100">
                    <div className="flex md:flex-row flex-col md:items-center md:justify-between md:gap-0 gap-2 justify-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full" style={{ backgroundColor: '#FF700099' }}>
                                <Shield className="w-8 h-8 text-black" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Admin Wallet</h1>
                                <p className="text-gray-600">Platform earnings and withdrawal management</p>
                            </div>
                        </div>
                        <div className="md:text-right mt-5">
                            <p className="text-sm text-gray-600">Platform Balance</p>
                            <p className="text-3xl font-bold" style={{ color: '#FF700099' }}>
                                {loading ? 'Loading...' : formatCurrency(walletData.balance)}
                            </p>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-4 md:mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Platform Balance</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(walletData.balance)}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Commission</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(walletData.totalCommissionEarned)}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Percent className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Payouts</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(walletData.totalPayoutsMade)}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100">
                                <ArrowUpRight className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Pending Requests</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : walletData.pendingWithdrawals}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">This Month</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(walletData.thisMonthCommission)}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Active Sellers</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {loading ? '...' : walletData.activeSellers}
                                </p>
                            </div>
                            <div className="p-3 rounded-full" style={{ backgroundColor: '#FF70001A' }}>
                                <Users className="w-6 h-6" style={{ color: '#FF700099' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl mb-8">
                    <div className="flex flex-col sm:flex-row border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 font-semibold rounded-t-2xl transition-all duration-200 text-[18px] lg:text-base ${activeTab === 'overview'
                                ? 'text-black border-b-2'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                            style={{
                                backgroundColor: activeTab === 'overview' ? '#FF700099' : 'transparent',
                                borderColor: activeTab === 'overview' ? '#FF700099' : 'transparent',
                            }}
                        >
                            <History className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                            Transaction History
                        </button>

                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 font-semibold rounded-t-2xl transition-all duration-200 relative text-[18px] lg:text-base ${activeTab === 'pending'
                                ? 'text-black border-b-2'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                            style={{
                                backgroundColor: activeTab === 'pending' ? '#FF700099' : 'transparent',
                                borderColor: activeTab === 'pending' ? '#FF700099' : 'transparent',
                            }}
                        >
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                            Pending Withdrawals
                            {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                                <span className="absolute top-1 right-1 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
                                    {withdrawals.filter(w => w.status === 'pending').length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('processed')}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 font-semibold rounded-t-2xl transition-all duration-200 text-[18px] lg:text-base ${activeTab === 'processed'
                                ? 'text-black border-b-2'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                            style={{
                                backgroundColor: activeTab === 'processed' ? '#FF700099' : 'transparent',
                                borderColor: activeTab === 'processed' ? '#FF700099' : 'transparent',
                            }}
                        >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                            Processed Withdrawals
                        </button>
                    </div>

                    {/* Tabs Content */}
                    <div className="p-4 sm:p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
                                    Recent Platform Transactions
                                </h3>
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 gap-2 sm:gap-0"
                                    >
                                        {/* Left */}
                                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                            <div
                                                className={`p-2 rounded-full ${transaction.type === 'credit'
                                                    ? 'bg-green-100'
                                                    : 'bg-red-100'
                                                    }`}
                                            >
                                                {transaction.type === 'credit' ? (
                                                    <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {transaction.description}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    {formatDate(transaction.createdAt)}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                                    {transaction.orderId && <span>Order: {transaction.orderId}</span>}
                                                    {transaction.sellerId && (
                                                        <span>
                                                            Seller: {transaction.sellerName} ({transaction.sellerId})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right */}
                                        <div className="text-right">
                                            <p
                                                className={`font-bold text-base sm:text-lg ${transaction.type === 'credit'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}
                                            >
                                                {transaction.type === 'credit' ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pending Tab */}
                        {activeTab === 'pending' && (
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
                                    Pending Withdrawal Requests
                                </h3>
                                {withdrawals
                                    .filter(w => w.status === 'pending')
                                    .map((withdrawal) => (
                                    <div
                                        key={withdrawal.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200 gap-3 sm:gap-0"
                                    >
                                        {/* Left */}
                                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                            <div className="p-2 rounded-full bg-yellow-100">
                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {withdrawal.sellerName}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Seller ID: {withdrawal.sellerId}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Requested: {formatDate(withdrawal.requestedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Right */}
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-sm sm:text-lg text-gray-800">
                                                    {formatCurrency(withdrawal.amount)}
                                                </p>
                                                <span className="px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        console.log('Approve clicked, withdrawal ID:', withdrawal._id);
                                                        handleWithdrawalAction(withdrawal._id, 'approve');
                                                    }}
                                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 text-xs sm:text-sm font-semibold"
                                                >
                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        console.log('Reject clicked, withdrawal ID:', withdrawal._id);
                                                        handleWithdrawalAction(withdrawal._id, 'reject');
                                                    }}
                                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-xs sm:text-sm font-semibold"
                                                >
                                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Processed Tab */}
                        {activeTab === 'processed' && (
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
                                    Recently Processed Withdrawals
                                </h3>
                                {withdrawals
                                    .filter(w => w.status !== 'pending')
                                    .map((withdrawal) => (
                                    <div
                                        key={withdrawal.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl gap-3 sm:gap-0"
                                    >
                                        {/* Left */}
                                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                            <div
                                                className={`p-2 rounded-full ${withdrawal.status === 'approved'
                                                    ? 'bg-green-100'
                                                    : 'bg-red-100'
                                                    }`}
                                            >
                                                {withdrawal.status === 'approved' ? (
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {withdrawal.sellerName}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Seller ID: {withdrawal.sellerId}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                                                    <span>Requested: {formatDate(withdrawal.requestedAt)}</span>
                                                    <span>Processed: {formatDate(withdrawal.processedAt)}</span>
                                                </div>
                                                {withdrawal.remarks && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Remarks: {withdrawal.remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Right */}
                                        <div className="text-right">
                                            <p className="font-bold text-sm sm:text-lg text-gray-800">
                                                {formatCurrency(withdrawal.amount)}
                                            </p>
                                            <span
                                                className={`px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold ${withdrawal.status === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {withdrawal.status.charAt(0).toUpperCase() +
                                                    withdrawal.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>



                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200 hover:bg-purple-50 cursor-pointer"
                            onClick={() => router.push("/sellers")}
                        >
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">View Sellers</p>
                                <p className="text-sm text-gray-600">Manage seller accounts</p>
                            </div>
                        </button>

                        <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200 hover:bg-purple-50 cursor-pointer"
                            onClick={() => router.push("/sellers/seller-orders")}
                        >
                            <div className="p-2 rounded-lg bg-green-100">
                                <ShoppingCart className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Order Management</p>
                                <p className="text-sm text-gray-600">Track all orders</p>
                            </div>
                        </button>

                        <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200 hover:bg-purple-50 cursor-pointer"
                            onClick={() => router.push("/")}
                        >
                            <div className="p-2 rounded-lg bg-yellow-100">
                                <TrendingUp className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Analytics</p>
                                <p className="text-sm text-gray-600">View detailed reports</p>
                            </div>
                        </button>

                        <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200 hover:bg-purple-50 cursor-pointer">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: '#FF70001A' }}>
                                <CreditCard className="w-5 h-5" style={{ color: '#FF700099' }} />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Payment Settings</p>
                                <p className="text-sm text-gray-600">Configure commission</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <ToastContainer />
    </>
);
};


export default AdminWalletDashboard;