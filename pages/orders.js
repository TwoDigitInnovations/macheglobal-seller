"use client";

import React, { useMemo, useEffect, useContext } from "react";
import { useState } from "react";
import Table from "@/components/table";
import { indexID } from "@/components/reported/customTableAct";
import isAuth from "@/components/isAuth";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import moment from "moment";
import { Drawer } from "@mui/material";
import {
  IoAddSharp,
  IoCloseCircleOutline,
  IoList,
  IoRemoveSharp,
} from "react-icons/io5";
import { userContext } from "./_app";
import Swal from "sweetalert2";

import {
  Search,
  Filter,
  Calendar,
  Package,
  XCircle,
  Mail,
  X,
} from "lucide-react";

function Orders(props) {
  const router = useRouter();
  const [user, setUser] = useContext(userContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userRquestList, setUserRquestList] = useState([]);
  const [openCart, setOpenCart] = useState(false);
  const [cartData, setCartData] = useState({});
  const [orderId, setOrderId] = useState("");
  const [selctDate, setSelctDate] = useState("");
  const [isDateSelectedManually, setIsDateSelectedManually] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });

 const handlePageChange = (page) => {
  setCurrentPage(page);
  getOrderBySeller(selctDate, page, 10, orderId);
};

  const BRAND_COLOR = "#FF700099";

  const closeDrawer = async () => {
    setOpenCart(false);
    setCartData({});
  };

  useEffect(() => {
    // Only fetch orders if we have a valid user ID
    if (user?._id) {
      const dateToSend = isDateSelectedManually ? selctDate : null;
      getOrderBySeller(dateToSend, currentPage, 10, orderId);
    } else {
      console.log('Waiting for user data...');
      setIsLoading(false);
    }
  }, [user, selctDate, currentPage, orderId]);

  const resetFilters = () => {
    setSelctDate("");
    setCurrentPage(1);
    setOrderId("");
  };

  const getOrderBySeller = async (
    selctDate,
    page = 1,
    limit = 10,
    orderId = ""
  ) => {
    setIsLoading(true);
    // Make sure we have a valid user ID
    if (!user?._id) {
      console.error("No user ID available");
      props.toaster({ type: "error", message: "User not authenticated" });
      setIsLoading(false);
      return;
    }

    let queryParams = `pageNumber=${page}&limit=${limit}`;
    
    if (selctDate) {
      queryParams += `&date=${moment(selctDate).format('YYYY-MM-DD')}`;
    }

    if (orderId) {
      queryParams += `&orderId=${orderId}`;
    }

    console.log(`Fetching orders for seller: ${user._id} with params:`, { 
      page, 
      limit, 
      selctDate, 
      orderId 
    });
    
    // Show loading state
    props.loader && props.loader(true);

    try {
      const response = await Api(
        "get",
        `orders/seller/${user._id}?${queryParams}`,
        null,
        router
      );

      console.log("Orders by seller:", response);
      setUserRquestList(response?.data || []);
      setPagination({
        totalPages: response?.pages || 1,
        currentPage: page,
        itemsPerPage: limit,
        totalItems: response?.count || 0
      });
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching orders:", err);
      props.toaster && props.toaster({ 
        type: "error", 
        message: err?.message || 'Failed to fetch orders' 
      });
    } finally {
      setIsLoading(false);
      props.loader && props.loader(false);
    }
  };

  const handleMarkAsShipped = async (orderId) => {
    try {
      props.loader && props.loader(true);
      
      // Service.js already adds /api/, so just use orders/updateStatus
      const response = await Api('post', 'orders/updateStatus', {
        id: orderId,
        status: 'shipped'
      }, router);

      if (response?.status === true) {
        // Show success message with SweetAlert
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Order marked as shipped successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Close drawer
        closeDrawer();
        
        // Refresh orders list
        getOrderBySeller(selctDate, currentPage);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response?.message || 'Failed to update order status'
        });
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to update order status. Please try again.'
      });
    } finally {
      props.loader && props.loader(false);
    }
  };

  function convertISODateToFormattedString(isoDateString) {
    const date = new Date(isoDateString);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${day} ${monthNames[monthIndex]} ${year}`;
  }

  function name({ row }) {
    const customerName = row.original.shippingAddress?.name || row.original.user?.name || 'N/A';
    return (
      <div>
        <p className="text-black text-[15px] font-normal text-center">
          {customerName}
        </p>
      </div>
    );
  }

  function Status({ row }) {
    const getStatus = (order) => {
      // Check the status field first (new status system)
      if (order.status) {
        switch (order.status.toLowerCase()) {
          case 'delivered':
            return { text: 'Delivered', color: 'text-green-600' };
          case 'shipped':
            return { text: 'Shipped', color: 'text-indigo-600' };
          case 'processing':
            return { text: 'Processing', color: 'text-blue-600' };
          case 'cancelled':
            return { text: 'Cancelled', color: 'text-red-600' };
          case 'pending':
            return { text: 'Pending', color: 'text-yellow-500' };
          default:
            break;
        }
      }
      
      // Fallback to old system (isDelivered, isPaid)
      if (order.isDelivered) return { text: 'Delivered', color: 'text-green-600' };
      if (order.isPaid) return { text: 'Paid - Processing', color: 'text-blue-600' };
      return { text: 'Pending', color: 'text-yellow-500' };
    };

    const status = getStatus(row.original);

    return (
      <div>
        <p className={`text-center text-[15px] font-medium ${status.color}`}>
          {status.text}
        </p>
      </div>
    );
  }

  function date({ row }) {
    return (
      <div>
        <p className="text-black text-base font-normal text-center">
          {convertISODateToFormattedString(row.original.createdAt)}
        </p>
      </div>
    );
  }

  function mobile({ row }) {
    // Get phone number from shippingAddress
    const phoneNumber = row.original.shippingAddress?.phone || 'N/A';
    return (
      <div>
        <p className="text-black text-[15px] font-normal text-center">
          {phoneNumber}
        </p>
      </div>
    );
  }

  const info = ({ value, row }) => {
    return (
      <div className="p-4 flex items-center justify-center">
        <button
          className="h-[38px] w-[93px] bg-[#00000020] text-black text-[15px] cursor-pointer font-normal rounded-[8px]"
          onClick={(e) => {
            e.stopPropagation();
            setOpenCart(true);
            setCartData(row.original);
          }}
        >
          View
        </button>
      </div>
    );
  };

  const OrderID = ({ row }) => {
    return (
      <div>
        <p className="text-black text-[15px] font-normal text-center">
          {row.original.orderId}
        </p>
      </div>
    );
  };


  const SellerCell = ({ value, row }) => {
    // Get unique sellers from order items
    const sellers = [...new Set(row.original.orderItems
      .filter(item => item.product?.SellerId)
      .map(item => item.product.SellerId.name)
    )].join(', ');
    
    return (
      <div>
        <p className="text-black text-[15px] font-normal text-center">
          {sellers || 'N/A'}
        </p>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        Header: "Date",
        Cell: date,
      },
      {
        Header: "Order #",
        Cell: OrderID,
      },
      {
        Header: "Seller",
        Cell: SellerCell,
      },
      {
        Header: "Customer",
        accessor: "user.name",
        Cell: name,
      },
      {
        Header: "Mobile",
        accessor: "user.phone",
        Cell: mobile,
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: Status,
      },
      {
        Header: "Details",
        Cell: info,
      },
    ],
    []
  );

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date))) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <section className=" w-full h-full bg-gray-100 px-6 pt-5">
      <p className="text-black font-bold  md:text-[32px] text-2xl">Orders</p>
      <section
        className="md:pb-32 h-full rounded-[12px] 
            overflow-y-scroll  scrollbar-hide overflow-scroll pb-28  pt-5"
      >
        <div className="bg-white mb-5 shadow-sm border border-gray-300 rounded-lg p-4 w-full">

          <div className="grid md:grid-cols-3 gap-4 p-2">
            <div className="relative">
              <label className="block text-[16px] font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Search by order ID"
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-[30px] focus:ring-2 focus:border-opacity-50 text-black"
                  style={{
                    borderColor: orderId ? BRAND_COLOR : undefined,
                    "--tw-ring-color": BRAND_COLOR,
                  }}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#FF700099]" />
                {orderId && (
                  <button
                    onClick={() => setOrderId("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4 text-[#127300]" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[16px] font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-[30px] focus:ring-2 focus:border-opacity-50 text-black"
                  style={{
                    "--tw-ring-color": BRAND_COLOR,
                  }}
                  type="date"
                  value={formatDate(selctDate)}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    setSelctDate(selected);
                    setIsDateSelectedManually(true);
                  }}
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-[#FF700099]" />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={resetFilters}
                className="px-4 py-2 cursor-pointer  rounded-md text-black"
                style={{
                  backgroundColor: BRAND_COLOR,
                  "--tw-ring-color": BRAND_COLOR,
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <Drawer
          className="custom-drawer"
          open={openCart}
          onClose={closeDrawer}
          anchor={"right"}
        >
          <div className="md:w-[43vw] w-[380px] relative">
            <div className="w-full h-full overflow-y-scroll scrollbar-hide overflow-scroll md:pb-44 pb-32">
              <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className="text-custom-orange text-xl font-semibold">
                    Order Details
                  </h2>
                </div>
                <IoCloseCircleOutline
                  className="text-custom-orange w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={closeDrawer}
                />
              </div>

              {cartData?.status === "cancelled" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">
                        Order has been cancelled
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="px-5 pt-4">
                <h3 className="text-gray-800 font-medium mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Shipping Address</h4>
                      {cartData?.shippingAddress ? (
                        <div className="text-sm text-gray-600">
                          <p>{cartData.shippingAddress.name}</p>
                          <p>{cartData.shippingAddress.address}</p>
                          <p>{cartData.shippingAddress.city}, {cartData.shippingAddress.postalCode}</p>
                          <p>{cartData.shippingAddress.country}</p>
                          <p className="mt-2">
                            <span className="font-medium">Phone:</span> {cartData.shippingAddress.phone}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No shipping address provided</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Order Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Order ID:</span> {cartData?.orderId}</p>
                        <p><span className="font-medium">Order Date:</span> {cartData?.createdAt ? new Date(cartData.createdAt).toLocaleDateString() : 'N/A'}</p>
                        <p><span className="font-medium">Payment Method:</span> {cartData?.paymentMethod ? cartData.paymentMethod.charAt(0).toUpperCase() + cartData.paymentMethod.slice(1) : 'N/A'}</p>
                        <p><span className="font-medium">Total Items:</span> {cartData?.orderItems?.length || 0}</p>
                        <p><span className="font-medium">Order Total:</span> ${cartData?.totalPrice?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-gray-800 font-medium mb-3">Order Items</h3>
                {cartData?.orderItems?.map((item, i) => (
                  <div
                    key={i}
                    className="border-b border-gray-100 py-4 rounded-lg"
                  >
                    <div className="flex items-center p-4 bg-white shadow-sm rounded-lg hover:bg-gray-50 transition-colors">
                      <div 
                        className="flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item?.product?._id) {
                            router.push(`/products/${item.product._id}`);
                          }
                        }}
                      >
                        <img
                          className="w-20 h-20 object-contain"
                          src={item?.image || (item.product?.image?.[0] || '/placeholder-product.png')}
                          alt={item?.name || item?.product?.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-product.png';
                          }}
                        />
                      </div>

                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="text-gray-800 font-semibold text-[16px]">
                            {item?.name || item?.product?.name}
                          </p>
                          <p className="text-gray-800 font-medium">
                            ${item?.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium w-20">Qty:</span>
                            <span>{item?.qty || 1}</span>
                          </div>
                          
                          {item?.product?.SellerId && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium w-20">Seller:</span>
                              <span>{item.product.SellerId.name || 'N/A'}</span>
                            </div>
                          )}
                          
                          {item?.color && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium w-20">Color:</span>
                              <span>{item.color}</span>
                            </div>
                          )}
                          
                          {item?.attribute && Object.entries(item.attribute)
                            .filter(([key]) => key.toLowerCase() !== 'color')
                            .map(([label, value], index) => (
                              <div key={index} className="flex items-center text-sm text-gray-600">
                                <span className="font-medium w-20 capitalize">{label}:</span>
                                <span>{value || 'N/A'}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            
              <div className="px-5 pt-6">
   
                {(cartData?.status === "delivered" || cartData?.isDelivered) && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700 font-medium">
                          Order has been delivered successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cartData?.status === "shipped" && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-indigo-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-indigo-700 font-medium">
                          Order has been shipped and is on the way
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cartData?.status === "processing" && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700 font-medium">
                          Order is being processed
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cartData?.status === "Return" && (
                  <div className="bg-green-50 border-l-4 border-custom-orange p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-custom-orange"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-custom-orange font-medium">
                          Order has been Return successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Footer */}
            <div className="fixed bottom-0 right-0 bg-white px-5 py-4 border-t border-gray-200 md:w-[43vw] w-[380px]">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal ({cartData?.orderItems?.length || 0} items):</span>
                  <span>${cartData?.itemsPrice?.toFixed(2) || '0.00'}</span>
                </div>
                {cartData?.shippingPrice > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${cartData.shippingPrice.toFixed(2)}</span>
                  </div>
                )}
                {cartData?.taxPrice > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${cartData.taxPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${cartData?.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <button 
                className="w-full py-3 rounded-lg text-white text-lg font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: BRAND_COLOR }}
                disabled={cartData?.isDelivered || cartData?.status === 'shipped' || cartData?.status === 'delivered'}
                onClick={() => {
                  Swal.fire({
                    title: 'Mark as Shipped?',
                    text: 'Are you sure you want to mark this order as shipped?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, mark as shipped!',
                    cancelButtonText: 'Cancel'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      handleMarkAsShipped(cartData._id);
                    }
                  });
                }}
              >
                {cartData?.isDelivered || cartData?.status === 'delivered' 
                  ? 'Order Completed' 
                  : cartData?.status === 'shipped' 
                    ? 'Already Shipped' 
                    : 'Mark as Shipped'}
              </button>
            </div>
          </div>
        </Drawer>

        <div className="bg-white  rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-20">
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                style={{ borderColor: BRAND_COLOR }}
              ></div>
            </div>
          ) : userRquestList.length === 0 ? (
            <div className="flex border border-gray-100 flex-col justify-center items-center min-h-[450px] text-center overflow-auto">
              <img
                src="/empty-box.png"
                alt="No data"
                className="w-32 h-32 mb-4 opacity-60"
              />
              <h3 className="text-xl font-medium text-gray-700 mb-1">
                No Orders found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or search OrderId
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={userRquestList}
                pagination={pagination}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                itemsPerPage={pagination.itemsPerPage}
              />
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default isAuth(Orders);
