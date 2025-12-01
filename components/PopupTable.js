import React, { useMemo, useState, useEffect, useContext } from "react";
import Table from "@/components/table";
import { FiEdit } from "react-icons/fi";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import { userContext } from "../pages/_app";
import moment from "moment";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Drawer } from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import Barcode from "react-barcode";
import { RxCrossCircled } from "react-icons/rx";
import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

function PopupTable(props) {
  const router = useRouter();
  const [productsList, setProductsList] = useState([]);
  const [user, setUser] = useContext(userContext);
  const [openCart, setOpenCart] = useState(false);
  const [cartData, setCartData] = useState({});
  const [viewPopup1, setviewPopup1] = useState(false);
  const [openIndex1, setOpenIndex1] = useState(null);
  const [popupData1, setPopupData1] = useState({});

  const [selectedNewSeller, setSelectedNewSeller] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });

  const closeDrawer = async () => {
    setOpenCart(false);
    setCartData({});
  };

  const toggleAccordion = (index) => {
    setOpenIndex1(openIndex1 === index ? null : index);
  };

  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  useEffect(() => {
    // if (user?._id) {
    //   getEmployee(currentPage);
    // }
    if (props?.data?.type === "Orders") {
      getOrders(currentPage);
    }
    if (props?.data?.type === "Products") {
      getProducts(currentPage);
    }
    if (props?.data?.type === "Employees") {
      getEmployee(currentPage);
    }
    if (props?.data?.type === "Returns") {
      getReturns(currentPage);
    }
  }, [user, currentPage]);

  const getOrders = async (page = 1, limit = 10) => {
    props?.loader(true);
    let url = `getOrderBySeller?page=${page}&limit=${limit}`;

    const data = {
      seller_id: props?.data?.id,
    };

    Api("post", url, data, router).then(
      (res) => {
        props?.loader(false);
        console.log("res================>", res.data);

        setProductsList(res.data);
        console.log("res================>", res.data);

        const selectednewIds = res.data.map((f) => {
          if (f.sponsered && f._id) return f._id;
        });
        console.log(selectednewIds);

        setSelectedNewSeller(selectednewIds);
        setPagination(res?.pagination);
      },
      (err) => {
        props?.loader(false);
        console.log(err);
        props?.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const getProducts = async (page = 1, limit = 10) => {
    props?.loader(true);
    let url;
    url = `getSellerProductByAdmin?page=${page}&limit=${limit}&seller_id=${props?.data?.id}`;

    Api("get", url, router).then(
      (res) => {
        props?.loader(false);
        console.log("res================>", res.data);

        setProductsList(res.data);
        console.log("res================>", res.data);

        const selectednewIds = res.data.map((f) => {
          if (f.sponsered && f._id) return f._id;
        });
        console.log(selectednewIds);

        setSelectedNewSeller(selectednewIds);
        setPagination(res?.pagination);
      },
      (err) => {
        props?.loader(false);
        console.log(err);
        props?.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const getEmployee = async (page = 1, limit = 10) => {
    props?.loader(true);
    let url = `getSellerEmployeeByAdmin?page=${page}&limit=${limit}&seller_id=${props?.data?.id}`;

    Api("get", url, router).then(
      (res) => {
        props?.loader(false);
        console.log("res================>", res.data);

        setProductsList(res.data);
        console.log("res================>", res.data);

        const selectednewIds = res.data.map((f) => {
          if (f.sponsered && f._id) return f._id;
        });
        console.log(selectednewIds);

        setSelectedNewSeller(selectednewIds);
        setPagination(res?.pagination);
      },
      (err) => {
        props?.loader(false);
        console.log(err);
        props?.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const getReturns = async (page = 1, limit = 10) => {
    props?.loader(true);
    let url = `getSellerReturnOrderByAdmin?page=${page}&limit=${limit}`;

    const data = {
      seller_id: props?.data?.id,
    };

    Api("post", url, data, router).then(
      (res) => {
        props?.loader(false);
        console.log("res================>", res.data);

        setProductsList(res.data || []);
        console.log("res================>", res.data);

        const selectednewIds = res.data.map((f) => {
          if (f.sponsered && f._id) return f._id;
        });
        console.log(selectednewIds);

        setSelectedNewSeller(selectednewIds);
        setPagination(res?.pagination);
      },
      (err) => {
        props?.loader(false);
        console.log(err);
        props?.toaster({ type: "error", message: err?.message });
      }
    );
  };

    const reminderSellerForReturn = async (orderId, sellerId) => {
      props.loader(true);
      let data = {
        orderId: orderId,
        sellerId: sellerId,
      };
      Api("post", "reminderSellerForReturn", data, router).then(
        (res) => {
          props.loader(false);
          setviewPopup1(false);
          props.toaster({ type: "success", message: "Reminder Send Successfully" });
          setPopupData1({});
          setOpenIndex1(null);
          closeDrawer();
          // getOrderBySeller(null, currentPage);
        },
        (err) => {
          props.loader(false);
          console.log(err);
          props.toaster({ type: "error", message: err?.message });
        }
      );
    };

  const index = ({ value, row }) => {
    return (
      <div className="flex items-center justify-center text-base">{value}</div>
    );
  };

  const productName = ({ value }) => {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value}</p>
      </div>
    );
  };

  const email = ({ row, value }) => {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value}</p>
      </div>
    );
  };

  const number = ({ value }) => {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value || "-"}</p>
      </div>
    );
  };

  const joiningDate = ({ value }) => {
    return (
      <div className="flex text-base items-center justify-center gap-2">
        {moment(value).format("DD/MM/YYYY")}
      </div>
    );
  };

  const image = ({ value, row }) => {
    return (
      <div className="flex items-center justify-center">
        {row.original &&
          row.original.varients &&
          row.original.varients.length > 0 && (
            <img
              className="h-[50px] w-[50px] rounded-[5px]"
              src={row.original.varients[0].image[0]}
            />
          )}
      </div>
    );
  };

  const actionHandler = ({ value, row }) => {
    return (
      <div className="bg-custom-offWhiteColor flex items-center  justify-evenly  border border-custom-offWhite rounded-[10px] mr-[10px]">
        <div
          className="py-[10px] w-[50%] items-center flex justify-center cursor-pointer"
          onClick={() => {
            router.push(`add-employee?id=${row.original._id}`);
          }}
        >
          <FiEdit className="text-[22px]  " />
        </div>
        {/* <div className="py-[10px] border-l-[1px] border-custom-offWhite w-[50%] items-center flex justify-center">
          <RiDeleteBinLine
            className="text-[red] text-[24px] cursor-pointer"
            onClick={() => deleteProduct(row.original._id)}
          />
        </div> */}
      </div>
    );
  };

  const columns = useMemo(() => {
    if (props?.data?.type === "Orders") {
      return [
        {
          Header: "Sr.No.",
          accessor: "indexNo",
          Cell: index,
        },
        {
          Header: "Order ID",
          accessor: (row) => row.orderId || row._id,
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Customer Name",
          accessor: "user.username",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Order Date",
          accessor: "createdAt",
          Cell: joiningDate,
        },
        {
          Header: "Status",
          accessor: "status",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Info",
          Cell: ({ row, value }) => (
            <div className="flex items-center  justify-center">
              <button
                className="h-[30px] w-[93px] bg-[#00000020] text-black text-base font-normal rounded-[8px]"
                onClick={() => {
                  setOpenCart(true);
                  setCartData(row.original);
                }}
              >
                See
              </button>
            </div>
          ),
        },
      ];
    } else if (props?.data?.type === "Products") {
      return [
        {
          Header: "Image",
          accessor: "username",
          Cell: image,
        },
        {
          Header: "Product Name",
          accessor: "name",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Category",
          accessor: "categoryName",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Price",
          accessor: "price_slot[0].our_price",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {currencySign(value)}
            </div>
          ),
        },
        {
          Header: "Listing Date",
          accessor: "createdAt",
          Cell: joiningDate,
        },
        {
          Header: "Expiry Date",
          accessor: "expirydate",
          Cell: joiningDate,
        },
        {
          Header: "Manufacturer",
          accessor: "manufacturername",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
      ];
    } else if (props?.data?.type === "Employees") {
      return [
        {
          Header: "ID",
          // accessor: "_id",
          accessor: "indexNo",
          Cell: index,
        },
        {
          Header: "Employee Name",
          accessor: "username",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Email",
          accessor: "email",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Joining Date",
          accessor: "createdAt",
          Cell: joiningDate,
        },
        {
          Header: "Mobile Number",
          accessor: "number",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Action",
          Cell: actionHandler,
        },
        //   {
        //     Header: "Info",
        //     // accessor: "view",
        //     Cell: info,
        //   },
      ];
    } else if (props?.data?.type === "Returns") {
      return [
        {
          Header: "Sr.No.",
          accessor: "indexNo",
          Cell: index,
        },
        {
          Header: "Order ID",
          accessor: (row) => row.orderId || row._id,
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        {
          Header: "Customer Name",
          accessor: "user.username",
          Cell: ({ value }) => (
            <div className="flex items-center justify-center text-base">
              {value}
            </div>
          ),
        },
        // {
        //   Header: "SELLER NAME",
        //   accessor: "seller_id.username",
        //     Cell: ({ value }) => (
        //         <div className="flex items-center justify-center text-base">
        //         {value}
        //         </div>
        //     ),
        // },
        {
          Header: "Order Date",
          accessor: "createdAt",
          Cell: joiningDate,
        },
        {
          Header: "Return Date",
          accessor: "productDetail[0].returnDetails.returnRequestDate",
          Cell: joiningDate,
        },
        // {
        //   Header: "STATUS",
        //   accessor: "status",
        //   Cell: status,
        // },
        {
          Header: "See Details",
          // accessor: "view",
          Cell: ({ row, value }) => (
            <div className="flex items-center  justify-center">
              <button
                className="h-[30px] w-[93px] bg-[#00000020] text-black text-base font-normal rounded-[8px]"
                onClick={() => {
                  setviewPopup1(true);
                  setPopupData1(row.original);
                }}
              >
                See
              </button>
            </div>
          ),
        },
      ];
    } else {
      return [
        {
          Header: "Sr.No.",
          accessor: "indexNo",
          Cell: index,
        },
        {
          Header: "Employee Name",
          accessor: "username",
          Cell: productName,
        },
        {
          Header: "Email",
          accessor: "email",
          Cell: email,
        },
        {
          Header: "Number",
          accessor: "number",
          Cell: number,
        },
        {
          Header: "Joining Date",
          accessor: "createdAt",
          Cell: joiningDate,
        },
        {
          Header: "ACTION",
          Cell: actionHandler,
        },
      ];
    }
  }, [selectedNewSeller, props?.data?.type]);

  return (
    <div className="w-full h-full bg-transparent md:pt-5 pt-5 pb-5 pl-5 pr-5">
      <Drawer
        className=""
        open={openCart}
        onClose={closeDrawer}
        anchor={"right"}
      >
        <div className="w-[310px] relative cursor-pointer">
          <div className="w-full p-5">
            <div className="!z-50 top-0 w-full border-b border-[#00000050]">
              <div className="flex justify-between cursor-pointer items-center pb-5 w-full">
                <p className="text-black text-sm font-normal">
                  Order ID: {cartData?.orderId || cartData?._id}
                </p>
                {/* Items • {CartItem} */}
                <IoCloseCircleOutline
                  className="text-black w-5 h-5"
                  onClick={closeDrawer}
                />
              </div>
            </div>

            {cartData?.productDetail?.map((item, i) => (
              <div
                className="w-full"
                key={i}
                onClick={() => {
                  router.push(
                    `/orders-details/${cartData?._id}?product_id=${cartData?.productDetail[0]?._id}`
                  );
                }}
              >
                <div className="grid grid-cols-4 w-full gap-2 py-5">
                  <div className="flex justify-center items-center">
                    <img
                      className="w-[50px] h-[50px] object-contain"
                      src={item?.image[0]}
                    />
                  </div>
                  <div className="col-span-2 w-full">
                    <p className="text-black text-xs font-normal">
                      {item?.product?.name}
                    </p>
                    {item?.color && (
                      <div className="flex justify-start items-center gap-1 pt-1">
                        <p className="text-[#1A1A1A70] text-xs font-normal mr-2">
                          Colour:
                        </p>
                        <p
                          className="md:w-[10px] w-[10px] md:h-[10px] h-[10px] rounded-full flex justify-center items-center border border-black"
                          style={{ background: item?.color }}
                        ></p>
                      </div>
                    )}
                    <div className="flex justify-start items-center gap-1">
                      <p className="text-[#1A1A1A70] text-xs font-normal mr-2">
                        Quantaty:
                      </p>
                      <p className="text-black text-base font-normal">
                        {item?.qty}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-start items-end">
                    <p className="text-black text-xs font-normal pt-5">
                      {(item?.total ?? item?.price ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="w-full">
              <div className="w-full flex justify-between items-center">
                <p className="text-black text-sm">Barcode:</p>
                <p className="text-black text-sm font-normal">
                  <Barcode
                    value={cartData._id}
                    height={20}
                    width={0.5}
                    fontSize={10}
                    // displayValue={false}
                  />
                </p>
              </div>
              <div className="w-full flex justify-between items-center">
                <p className="text-black text-sm">Tax:</p>
                <p className="text-black text-sm font-normal">
                  {(cartData?.tax)}
                </p>
              </div>
              <div className="w-full flex justify-between items-center my-1">
                <p className="text-black text-sm">Delivery Fee:</p>
                <p className="text-black text-sm font-normal">
                  {(cartData?.deliveryCharge)}
                </p>
              </div>
              <div className="w-full flex justify-between items-center">
                <p className="text-black text-sm">Delivery Tip:</p>
                <p className="text-black text-sm font-normal">
                  {(cartData?.deliveryTip)}
                </p>
              </div>
            </div>

            <div className="mt-5 !w-[270px] !z-50 fixed bottom-0  flex flex-col justify-start">
              <div className="bg-white flex justify-between border-t border-gray-300 text-lg font-bold items-center pb-5 pt-2 cursor-pointer">
                <p className="text-black text-base font-semibold">Total:</p>
                <p className="text-black text-base font-normal">
                  {(cartData?.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {viewPopup1 && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/30 flex justify-center items-center z-[9]">
          <div className="relative w-[300px] md:w-[460px] h-auto bg-white rounded-[15px] m-auto">
            <div
              className="absolute top-2 right-2 p-1 rounded-full text-black w-8 h-8 cursor-pointer"
              onClick={() => {
                setviewPopup1(!viewPopup1);
                setPopupData1({});
                setOpenIndex1(null);
              }}
            >
              <RxCrossCircled className="h-full w-full font-semibold " />
            </div>

            <div className="max-h-[400px] px-5 w-full py-3 overflow-y-scroll scrollbar-hide">
              <p className="text-center mt-2 font-semibold text-xl text-custom-black">
                Returned Product Details
              </p>

              <ul className="rounded-md space-y-2 my-4">
                {popupData1?.productDetail?.length > 0 &&
                  popupData1?.productDetail?.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-custom-darkpurple/10 p-2"
                    >
                      <button
                        className="flex items-center justify-between w-full focus:outline-none"
                        type="button"
                        onClick={() => toggleAccordion(index)}
                      >
                        <div className="flex items-center gap-2">
                          <img src={item?.image[0]} className="w-10 h-10" />
                          <div className="flex flex-col items-start gap-0.5">
                            <p className="text-custom-black text-base font-semibold">
                              {item?.product?.name}
                            </p>
                            <p className="text-custom-black text-sm font-normal">
                              {(item?.total ?? item?.price ?? 0)}
                            </p>
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            openIndex1 === index ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 13.535l4.95-4.95 1.414 1.414-6.364 6.364-6.364-6.364 1.414-1.414z" />
                        </svg>
                      </button>
                      {openIndex1 === index && (
                        <div className="accordion-content p-4">
                          <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-1 flex flex-col gap-1">
                              <dt className="text-custom-darkpurple text-sm font-semibold">
                                Return Reason
                              </dt>
                              <dd className="col-span-2 mt-1 text-sm text-gray-600 sm:mt-0 sm:col-span-2">
                                {item?.returnDetails?.reason}
                              </dd>
                            </div>
                            <div className="py-1 flex flex-col gap-1">
                              <dt className="text-custom-darkpurple text-sm font-semibold">
                                Return Date & Time
                              </dt>
                              <dd className="col-span-2 mt-1 text-sm text-gray-600 sm:mt-0 sm:col-span-2">
                                {moment(
                                  item?.returnDetails?.returnRequestDate
                                ).format("YYYY-MM-DD hh:mm:ss A")}
                              </dd>
                            </div>
                            <div className="py-1 flex flex-col gap-1">
                              <dt className="text-custom-darkpurple text-sm font-semibold">
                                Barcode
                              </dt>
                              <dd className="col-span-2 mt-1 text-sm text-gray-600 sm:mt-0 sm:col-span-2">
                                <Barcode
                                  value={item._id}
                                  height={20}
                                  width={0.5}
                                  fontSize={10}
                                  background="transparent"
                                  // displayValue={false}
                                />
                              </dd>
                            </div>
                            <div className="py-1 flex flex-col gap-1">
                              <dt className="text-custom-darkpurple text-sm font-semibold">
                                Proof
                              </dt>
                              <dd className="mt-1 text-sm text-gray-600 sm:mt-0 sm:col-span-2 px-3">
                                <Slider {...settings}>
                                  {item?.returnDetails?.proofImages?.map(
                                    (media, i) => {
                                      const isVideo =
                                        media?.match(/\.(mp4|webm|ogg)$/i);

                                      return (
                                        <div className="w-auto" key={i}>
                                          {isVideo ? (
                                            <video
                                              controls
                                              autoPlay
                                              className="w-auto h-[200px] object-fill rounded-md mr-2"
                                              src={media}
                                            />
                                          ) : (
                                            <img
                                              src={media}
                                              className="w-full h-[200px] object-cover rounded-md mr-2"
                                              alt={`proof-${i}`}
                                            />
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </Slider>
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>

              <div className="flex items-center gap-3">
                <button
                  // disabled={!popupData1?.assignedEmployee}
                  onClick={() => {
                      reminderSellerForReturn(
                        popupData1?.orderId || popupData1?._id,
                        popupData1?.seller_id?._id
                      );
                      setviewPopup1(false);
                      setPopupData1({});
                      setOpenIndex1(null);
                    }}
                  className="text-white bg-custom-darkpurple hover:bg-custom-darkpurple/90 px-5 py-2 rounded justify-center mx-auto grid w-60 cursor-pointer disabled:bg-custom-darkpurple/30"
                >
                  Send Seller Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="md:pt-[0px] pt-[0px] h-full">
        <div className="flex items-center gap-3">
          <IoMdArrowRoundBack
            onClick={props?.goBack}
            className="text-black size-8 cursor-pointer"
          />
          <p className="text-black font-bold md:text-[32px] text-2xl">
            {props?.data?.name + " " + props?.data?.type || ""}
          </p>
        </div>
        {/* mt-3 */}
        <div className="bg-white h-full px-5 rounded-[12px] overflow-scroll !h-auto">
          <Table
            columns={columns}
            data={productsList}
            pagination={pagination}
            onPageChange={(page) => setCurrentPage(page)}
            currentPage={currentPage}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
}

export default PopupTable;
