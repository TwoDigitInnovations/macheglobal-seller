import React, { useState, useContext, useEffect } from "react";
import {
  Clock,
  DollarSign,
  Trash2,
  Plus,
  ShoppingBag,
  Calendar,
  Timer,
} from "lucide-react";
import isAuth from "@/components/isAuth";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import { userContext } from "./_app";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

function SaleProduct(props) {
  const router = useRouter();
  const [user, setUser] = useContext(userContext);
  const [saleData, setSaleData] = useState([]);
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    if (user?._id) {
      getSales();
    }
  }, [user]);

  const getSales = async () => {
    props.loader(true);
    Api("get", `sale/getFlashSale?SellerId=${user._id}`, router).then(
      (res) => {
        console.log(res);
        props.loader(false);
        if (res.status) {
          setSaleData(res.data);
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.message)
      }
    );
  };

  const deleteSale = async (saleId) => {
    Swal.fire({
      title: "Delete Sale?",
      text: "You want to remove this product from sale?",
      showCancelButton: true,
      confirmButtonColor: "#FF700099",
      cancelButtonColor: "#FF700099",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        confirmButton: "px-12 rounded-xl",
        cancelButton: "px-12 rounded-xl",
        popup: "rounded-[15px]",
      },
      buttonsStyling: true,
      reverseButtons: true,
      width: "400px",
    }).then((result) => {
      if (result.isConfirmed) {
        props.loader(true);

        Api("delete", `sale/deleteFlashSale/${saleId}?SellerId=${user._id}`, {}, router).then(
          (res) => {
            props.loader(false);
            if (res.status) {
              toast.success("Sale deleted Sucessfully")
              getSales();
            }
          },
          (err) => {
            props.loader(false);
            console.log(err);
            props.toaster({ type: "error", message: err?.message });
          }
        );
      }
    });
  };

  const toggleSaleStatus = async (saleId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    props.loader(true);

    Api(
      "put",
      `sale/toggleFlashSaleStatus/${saleId}?SellerId=${user._id}`,
      { status: newStatus },
      router
    ).then(
      (res) => {
        props.loader(false);
        if (res.status) {
          toast.success(`Sale ${newStatus.toLowerCase()} successfully`)
          toast.suc
          getSales();
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.message)
      }
    );
  };

  const deleteAllSales = async () => {
    Swal.fire({
      title: "Delete All Sales?",
      text: "This will delete all flash sales. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF700099",
      cancelButtonColor: "#FF700099",
      confirmButtonText: "Yes, delete all!",
      customClass: {
        confirmButton: "px-12 rounded-xl",
        cancelButton: "px-12 rounded-xl",
        popup: "rounded-[15px]",
      },
      buttonsStyling: true,
      reverseButtons: true,
      width: "400px",
    }).then((result) => {
      if (result.isConfirmed) {
        props.loader(true);

        Api("delete", `sale/deleteAllFlashSales?SellerId=${user._id}`, {}, router).then(
          (res) => {
            props.loader(false);
            if (res.status) {
              toast.success("All sales deleted successfully")
              getSales();
            }
          },
          (err) => {
            props.loader(false);
            console.log(err);
            props.toaster({ type: "error", message: err?.message });
          }
        );
      }
    });
  };

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const newCountdown = {};

      saleData.forEach((sale) => {
        const startDate = new Date(sale.startDateTime).getTime();
        const endDate = new Date(sale.endDateTime).getTime();

        if (now < startDate) {
          const distance = startDate - now;
          newCountdown[sale._id] = {
            ...calculateTimeLeft(distance),
            status: "upcoming",
            message: "Sale starts in",
          };
        } else if (now >= startDate && now < endDate) {
          // Sale is active
          const distance = endDate - now;
          newCountdown[sale._id] = {
            ...calculateTimeLeft(distance),
            status: "active",
            message: "Sale ends in",
          };
        } else {
          // Sale has ended
          newCountdown[sale._id] = {
            status: "expired",
            message: "Sale has ended",
          };
        }
      });

      setCountdown(newCountdown);
    };

    const calculateTimeLeft = (distance) => {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    if (saleData.length > 0) {
      calculateCountdown();
      const interval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [saleData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "upcoming":
        return "bg-blue-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "upcoming":
        return "text-blue-600";
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="w-full h-full bg-gray-100 md:pt-5 pt-5 px-6 overflow-y-scroll   scrollbar-hide overflow-scroll pb-28">
      <div className="md:pt-[0px] pt-[0px] h-full">

        <div className="flex md:flex-row flex-col justify-between items-start mb-6 gap-4">
          <div className="flex items-center">
            <h1 className="text-black font-bold md:text-[32px] text-2xl">
              Sale
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 text-black bg-custom-orange px-5 py-2.5 rounded-lg  transition-colors"
              onClick={() => router.push("/AddSale")}
            >
              <Plus className="h-5 w-5" />
              Add Sale
            </button>
            {saleData.length > 0 && (
              <button
                className="flex items-center gap-2 text-black bg-custom-orange px-5 py-2.5 rounded-lg bg-custom-orange transition-colors"
                onClick={deleteAllSales}
              >
                <Trash2 className="h-5 w-5" />
                End All Sales
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[12px] md:p-6 p-2 overflow-scroll md:pb-48 pb-28">
          {saleData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {saleData.map((sale) => (
                <div
                  key={sale._id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="relative">
                    <div
                      className={`absolute top-4 md:right-4 right-2 px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(
                        countdown[sale._id]?.status || "expired"
                      )}`}
                    >
                      {sale.status}
                    </div>


                    <div className="p-4 flex justify-center">
                      <div className="relative">
                        {sale?.variant?.image[0] ? (
                          <img
                            src={sale?.variant?.image[0]}
                            alt={sale.product?.name || "Product"}
                            className="w-32 h-full object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-gray-400" />
                          </div>
                        )}

                        <div className="absolute -bottom-2 -right-2 bg-custom-orange text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          ${sale.price}
                        </div>


                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {sale.product?.name || "Unknown Product"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {sale.product?.categoryName || "No Category"}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-custom-orange">
                        ${sale.price}
                      </span>
                      {sale?.offerPrice &&
                        sale?.offerPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${sale?.offerPrice}
                          </span>
                        )}
                      {sale?.offerPrice &&
                        sale?.offerPrice && (
                          <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">
                            {Math.round(
                              ((sale?.offerPrice -
                                sale.price) /
                                sale?.offerPrice) *
                              100
                            )}
                            % OFF
                          </span>
                        )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {sale?.attribute?.length > 0 ? (
                        sale.attribute.map((att, id) => (
                          <div key={id} className="flex items-center gap-4 text-sm text-gray-700">
                            <p className="font-medium">{att.label}:</p>
                            <p>{att.value}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No attributes selected</p>
                      )}
                    </div>



                    <div className="mb-4">
                      <div
                        className={`text-center p-3 rounded-lg ${countdown[sale._id]?.status === "active"
                          ? "bg-green-50 border border-green-200"
                          : countdown[sale._id]?.status === "upcoming"
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-red-50 border border-red-200"
                          }`}
                      >
                        <p
                          className={`text-sm font-medium mb-2 ${getStatusTextColor(
                            countdown[sale._id]?.status || "expired"
                          )}`}
                        >
                          {countdown[sale._id]?.message || "Sale has ended"}
                        </p>

                        {countdown[sale._id]?.days !== undefined && (
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <div className="text-xl font-bold text-gray-800">
                                {countdown[sale._id].days}
                              </div>
                              <div className="text-xs text-gray-500">Days</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <div className="text-xl font-bold text-gray-800">
                                {countdown[sale._id].hours}
                              </div>
                              <div className="text-xs text-gray-500">Hours</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <div className="text-xl font-bold text-gray-800">
                                {countdown[sale._id].minutes}
                              </div>
                              <div className="text-xs text-gray-500">Min</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <div className="text-xl font-bold text-gray-800">
                                {countdown[sale._id].seconds}
                              </div>
                              <div className="text-xs text-gray-500">Sec</div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Sale Duration */}
                    <div className="text-xs text-gray-500 mb-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Start:{" "}
                          {new Date(sale.startDateTime).toLocaleDateString()}{" "}
                          {new Date(sale.startDateTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        <span>
                          End: {new Date(sale.endDateTime).toLocaleDateString()}{" "}
                          {new Date(sale.endDateTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSaleStatus(sale._id, sale.status)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sale.status === "ACTIVE"
                          ? "bg-custom-orange text-black "
                          : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                      >
                        {sale.status === "ACTIVE" ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteSale(sale._id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="h-24 w-24 text-custom-orange mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Flash Sales Active
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first flash sale to get started
              </p>
              <button
                className="flex items-center gap-2 text-black bg-custom-orange px-4 py-2 rounded-lg transition-colors mx-auto"
                onClick={() => router.push("/AddSale")}
              >
                <Plus className="h-5 w-5" />
                Create Flash Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default isAuth(SaleProduct);
