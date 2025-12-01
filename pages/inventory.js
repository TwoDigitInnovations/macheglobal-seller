import React, { useMemo, useState, useEffect, useContext } from "react";
import Table from "@/components/table";
import { FiEdit, FiEye, FiX } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FaCopy } from "react-icons/fa";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { userContext } from "./_app";
import isAuth from "@/components/isAuth";
import { Search, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

function Inventory(props) {
  const router = useRouter();
  const [productsList, setProductsList] = useState([]);
  const [user, setUser] = useContext(userContext);

  const [selectedNewSeller, setSelectedNewSeller] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [themeData, setThemeData] = useState([]);
  const [viewProduct, setViewProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 4,
  });

  useEffect(() => {
    if (user?._id) {
      getProduct(currentPage);
    }
  }, [user, currentPage, searchTerm]); // 👈 searchTerm added

  const getProduct = async (page = 1, limit = 10) => {
    props.loader(true);
    let url = `product/getProduct?page=${page}&limit=${limit}&SellerId=${user._id}`;

    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    Api("get", url, {}, router).then(
      (res) => {
        console.log("res================>", res);
        props.loader(false);
        setProductsList(res.data);
        setPagination(res.pagination);
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.data?.message || err?.message)
      }
    );
  };



  const image = ({ value, row }) => {
    return (
      <div className="flex flex-col items-center justify-center">
        {row.original &&
          row.original.varients &&
          row.original.varients.length > 0 && (
            <img
              className="md:h-[116px] md:w-[126px] h-20 w-40 object-contain  rounded-md"
              src={row.original.varients[0].image[0]}
              alt="Product"
              onError={(e) => {
                e.target.src = "/placeholder-image.png"; // Add fallback image
              }}
            />
          )}
      </div>
    );
  };

  const productName = ({ value }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{value || "N/A"}</p>
      </div>
    );
  };

  const category = ({ row, value }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">
          {row.original?.categoryName?.toString() || "N/A"}
        </p>
      </div>
    );
  };

  const price = ({ row }) => {
    const value = row.original?.varients?.[0]?.selected?.[0]?.offerprice;
    const formattedPrice =
      !isNaN(value) && value !== null && value !== undefined
        ? parseFloat(value).toFixed(2)
        : "0.00";

    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">${formattedPrice}</p>
      </div>
    );
  };

  const piece = ({ row }) => {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <p className="text-black text-base font-normal">{row.original.pieces}</p>
      </div>
    );
  };

  const availableColor = ({ value }) => {
    if (!value || !Array.isArray(value)) {
      return (
        <div className="p-4 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No colors</p>
        </div>
      );
    }

    return (
      <div className="p-4 flex items-center justify-center gap-2 max-w-80 flex-wrap">
        {value.map((item, i) => (
          <div
            key={i}
            className="text-base font-normal rounded-full h-5 w-5 border border-black"
            style={{ background: item?.color || "#ccc" }}
            title={item?.colorName || "Color"}
          ></div>
        ))}
      </div>
    );
  };

  const handleEditProduct = (product) => {
    router.push(`/add-product?id=${product._id}`);
  };

  const handleViewProduct = (product) => {
    setViewProduct(product);
    setShowProductModal(true);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render product details modal
  const renderProductModal = () => {
    if (!viewProduct) return null;

    const variant = viewProduct.varients?.[0] || {};
    const selectedVariant = variant.selected?.[0] || {};
    const images = variant.image || [];

    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl text-gray-800  font-semibold">Product Details</h2>
            <button 
              onClick={() => setShowProductModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Product Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Images */}
              <div>
                <div className="mb-4 h-80 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {images[0] ? (
                    <img 
                      src={images[0]} 
                      alt={viewProduct.name} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400">No image available</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto py-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex-shrink-0 w-16 h-16 border rounded overflow-hidden">
                        <img 
                          src={img} 
                          alt={`${viewProduct.name} ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div>
                <h1 className="text-2xl text-gray-800  font-bold mb-2">{viewProduct.name}</h1>
                <div className="flex items-center mb-4">
                  <span className="text-gray-500">Category: </span>
                  <span className="ml-2 text-gray-800">{viewProduct.categoryName || 'N/A'}</span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedVariant.offerprice || '0.00'}
                    </span>
                    {selectedVariant.mrp > selectedVariant.offerprice && (
                      <span className="text-gray-500 line-through">
                        ${selectedVariant.mrp}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-700">Available Stock</p>
                      <p className="font-medium text-gray-800">{viewProduct.pieces || 0} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Sold</p>
                      <p className="font-medium text-gray-800">{viewProduct.sold_pieces || 0} units</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-700">
                    {viewProduct.short_description || 'No description available'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700">Created</p>
                    <p className="text-gray-800">{formatDate(viewProduct.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Last Updated</p>
                    <p className="text-gray-800">{formatDate(viewProduct.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg text-gray-800 font-semibold mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700">Product ID</p>
                  <p className="font-mono text-gray-800">{viewProduct._id}</p>
                </div>
                <div>
                  <p className="text-gray-700">Category</p>
                  <p className="text-gray-800">{viewProduct.categoryName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-700">Subcategory</p>
                  <p className="text-gray-800" >{viewProduct.subCategoryName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-700">Gender</p>
                  <p className="text-gray-800">{viewProduct.gender || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t flex justify-end space-x-3">
            <button
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowProductModal(false);
                handleEditProduct(viewProduct);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Product
            </button>
          </div>
        </div>
      </div>
    );
  };

  const actionHandler = ({ value, row }) => {
    return (
      <div className="bg-custom-offWhiteColor flex items-center justify-evenly border border-custom-offWhite rounded-[10px] mr-[10px] overflow-hidden">
        <div
          className="py-[10px] w-1/3 items-center flex justify-center border-r border-custom-offWhite cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleViewProduct(row.original)}
          title="View Product"
        >
          <FiEye className="text-[22px] text-blue-600" />
        </div>
        <div
          className="py-[10px] w-1/3 items-center flex justify-center border-r border-custom-offWhite cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleEditProduct(row.original)}
          title="Edit Product"
        >
          <FiEdit className="text-[22px] text-green-600" />
        </div>
        <div
          className="py-[10px] w-1/3 items-center flex justify-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => deleteProduct(row.original._id)}
          title="Delete Product"
        >
          <RiDeleteBinLine className="text-[red] text-[24px]" />
        </div>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        Header: "Image",
        accessor: "username",
        Cell: image,
      },
      {
        Header: "Product Name",
        accessor: "name",
        Cell: productName,
      },
      {
        Header: "Category",
        accessor: "category",
        Cell: category,
      },
      {
        Header: "Price",
        // accessor: "price",
        Cell: price,
      },
      {
        Header: "Unit",
        // accessor: "pieces",
        Cell: piece,
      },
      {
        Header: "Available Color",
        accessor: "varients",
        Cell: availableColor,
      },
      {
        Header: "ACTION",
        Cell: actionHandler,
      },
    ],
    [themeData]
  );

  const deleteProduct = (_id) => {
    Swal.fire({
      text: "Are you sure? You want to proceed with the delete?",
      showCancelButton: true,
      cancelButtonColor: "#127300",
      confirmButtonText: "Delete",
      confirmButtonColor: "#127300",
      width: "380px",
    }).then(function (result) {
      if (result.isConfirmed) {
        const data = {
          _id,
        };

        props.loader(true);
        Api("delete", `product/deleteProduct/${_id}`, data, router).then(
          (res) => {
            console.log("res================>", res.data?.message);
            props.loader(false);

            if (res?.status) {
              getProduct(currentPage);
              toast.success(res?.data?.message || "Product deleted successfully")
            } else {
              toast.error(res?.data?.message || "Failed to delete product")
            }
          },
          (err) => {
            props.loader(false);
            console.log(err);
            toast.error(err?.data?.message || err?.message)
          }
        );
      }
    });
  };

  return (
    <div className="bg-gray-100 w-full h-full py-5 px-5">
      <div className="md:pt-[0px] pt-[0px] h-full">
        <p className="text-black font-bold md:text-[32px] text-2xl">
          <span className="w-2 h-8 bg-[#F38529] rounded "></span>
          Inventory
        </p>
        <div className=" md:pb-32 h-full overflow-y-scroll scrollbar-hide overflow-scroll pb-28 mt-5">
          <div className="">
            <div className="bg-white py-4 px-4 rounded-md flex md:flex-row flex-col md:justify-between md:items-end gap-3 relative">
              <Search size={18} className="absolute left-7 top-7 text-gray-700" />
              <input
                className="  border border-gray-400 outline-none py-2 md:w-[435px] w-full pl-9 rounded-[30px] text-gray-700 font-semibold md:text-base text-sm"
                type="text"
                placeholder="Search Products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                className="text-black bg-custom-orange px-5 py-2 md:text-[16px] text-[14px] rounded-md cursor-pointer transition-colors"
                onClick={() => router.push("/add-product")}
              >
                Add Product
              </button>
            </div>

            <div className="mt-5 px-3 bg-white min-h-[500px] rounded-md ">
              {productsList && productsList.length > 0 ? (
                <Table
                  columns={columns}
                  data={productsList}
                  pagination={pagination}
                  onPageChange={(page) => setCurrentPage(page)}
                  currentPage={currentPage}
                  itemsPerPage={pagination?.itemsPerPage}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 py-20">
                  <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm text-gray-400">Please try searching again.</p>
                  <button
                    className="text-black bg-custom-orange px-10 py-2 md:text-[16px] text-[14px] rounded-md cursor-pointer transition-colors mt-5"
                    onClick={() => router.push("/add-product")}
                  >
                    Add Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Details Modal */}
      {showProductModal && renderProductModal()}
    </div>
  );
};

export default isAuth(Inventory);
