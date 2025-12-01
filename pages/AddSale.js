import React, { useState, useContext, useEffect } from "react";
import Select from "react-select";
import {
  ShoppingBag,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  Package,
  Tag,
} from "lucide-react";
import isAuth from "@/components/isAuth";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import { userContext } from "./_app";
import { toast } from "react-toastify";

function AddSale(props) {
  const router = useRouter();
  const [user, setUser] = useContext(userContext);
  const [productsList, setProductsList] = useState([]);
  const [saleItems, setSaleItems] = useState([]);

  console.log(user?._id)

  useEffect(() => {
    if (user?._id) {   // ensure user id is available
      getProduct();
    }
  }, [user]); // dependency me user daala


  const getProduct = async () => {
    props.loader(true);
    let url = `product/getProduct?SellerId=${user._id}`;

    Api("get", url, router).then(
      (res) => {
        props.loader(false);
        setProductsList(res.data);
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.message || "An error occurred")
      }
    );
  };

  const availableProducts = productsList.filter(
    (product) => !saleItems.some((item) => item.product === product._id)
  );

  const productOptions = availableProducts.map((product) => ({
    value: product._id,
    label: `${product.name} - ${product.categoryName} - ${product.subCategoryName || "Not available"}`,
    product: product,
  }));

  const addSaleItem = () => {
    setSaleItems([
      ...saleItems,
      {
        product: "",
        variant: "",
        attribute: "",
        startDateTime: "",
        endDateTime: "",
        price: "",
        originalPrice: "",
        offerPrice: "",
        availableQty: "",
        productDetails: null,
        selectedVariant: null,
        selectedAttribute: null,
      },
    ]);
  };

  useEffect(() => {
    setSaleItems([
      ...saleItems,
      {
        product: "",
        variant: "",
        attribute: "",
        startDateTime: "",
        endDateTime: "",
        price: "",
        originalPrice: "",
        offerPrice: "",
        availableQty: "",
        productDetails: null,
        selectedVariant: null,
        selectedAttribute: null,
      },
    ]);
  }, [])

  const removeSaleItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (index, field, value) => {
    const updatedItems = [...saleItems];
    updatedItems[index][field] = value;

    if (field === "product") {
      const selectedProduct = productsList.find((p) => p._id === value);
      updatedItems[index].productDetails = selectedProduct;
      // Reset dependent fields
      updatedItems[index].variant = "";
      updatedItems[index].attribute = "";
      updatedItems[index].selectedVariant = null;
      updatedItems[index].selectedAttribute = null;
      updatedItems[index].originalPrice = "";
      updatedItems[index].offerPrice = "";
      updatedItems[index].availableQty = "";
      updatedItems[index].price = "";
    }

    if (field === "variant") {
      const product = updatedItems[index].productDetails;
      if (product && product.varients && product.varients[value] !== undefined) {
        updatedItems[index].selectedVariant = product.varients[value];
        // Reset attribute-dependent fields
        updatedItems[index].attribute = "";
        updatedItems[index].selectedAttribute = null;
        updatedItems[index].originalPrice = "";
        updatedItems[index].offerPrice = "";
        updatedItems[index].availableQty = "";
        updatedItems[index].price = "";
      }
    }

    if (field === "attribute") {
      const variant = updatedItems[index].selectedVariant;
      if (variant && variant.selected && variant.selected[value] !== undefined) {
        const selectedAttr = variant.selected[value];
        updatedItems[index].selectedAttribute = selectedAttr;
        updatedItems[index].originalPrice = selectedAttr.price || "";
        updatedItems[index].offerPrice = selectedAttr.offerprice || "";
        updatedItems[index].availableQty = selectedAttr.qty || "";

      }
    }

    setSaleItems(updatedItems);
  };

  const VariantOption = ({ data, ...props }) => {
    const { innerProps, innerRef } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
        style={{
          backgroundColor: props.isSelected ? '#127300' : props.isFocused ? 'rgba(18, 115, 0, 0.1)' : 'transparent',
          color: props.isSelected ? 'white' : 'inherit'
        }}
      >
        {data.image && (
          <img
            src={data.image}
            alt={data.label}
            className="w-8 h-8 rounded mr-3 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <span>{data.label}</span>
      </div>
    );
  };

  const getVariantOptions = (productDetails) => {
    if (!productDetails || !productDetails.varients || !Array.isArray(productDetails.varients)) {
      return [];
    }

    return productDetails.varients.map((variant, idx) => {
      // Build label based on available properties
      let labelParts = [];

      if (variant.color) {
        labelParts.push(`Color: ${variant.color}`);
      }
      if (variant.size) {
        labelParts.push(`Size: ${variant.size}`);
      }
      if (variant.material) {
        labelParts.push(`Material: ${variant.material}`);
      }
      if (variant.style) {
        labelParts.push(`Style: ${variant.style}`);
      }

      // If no specific properties found, use a generic label
      if (labelParts.length === 0) {
        labelParts.push(`Variant ${idx + 1}`);
      }

      return {
        value: idx,
        label: labelParts.join(' | '),
        variant: variant,
        image: variant.image?.[0] || null, // Support different image field structures
      };
    });
  };

  const getAttributeOptions = (selectedVariant) => {
    if (!selectedVariant || !selectedVariant.selected || !Array.isArray(selectedVariant.selected)) {
      return [];
    }

    return selectedVariant.selected.map((sel, idx) => {
      let attributeLabel = "Attributes: ";

      if (sel.attributes && Array.isArray(sel.attributes) && sel.attributes.length > 0) {
        attributeLabel += sel.attributes.map((a) => `${a.label}: ${a.value}`).join(", ");
      } else {
        attributeLabel += `Option ${idx + 1}`;
      }

      // Add price info to label
      const priceInfo = [];
      if (sel.price) priceInfo.push(`Price: $${sel.price}`);
      if (sel.offerprice) priceInfo.push(`Offer: $${sel.offerprice}`);
      if (sel.qty !== undefined) priceInfo.push(`Qty: ${sel.qty}`);

      if (priceInfo.length > 0) {
        attributeLabel += ` (${priceInfo.join(', ')})`;
      }

      return {
        value: idx,
        label: attributeLabel,
        price: sel.price,
        offerprice: sel.offerprice,
        qty: sel.qty,
        attributes: sel.attributes || [],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invalidItems = saleItems.filter((item) => {

      if (!item.product || !item.startDateTime || !item.endDateTime || !item.price) {
        return true;
      }


      if (item.productDetails && item.productDetails.varients && item.productDetails.varients.length > 0) {
        if (item.variant === "" || item.variant === null || item.variant === undefined) {
          return true;
        }


        if (item.selectedVariant && item.selectedVariant.selected && item.selectedVariant.selected.length > 0) {
          if (item.attribute === "" || item.attribute === null || item.attribute === undefined) {
            return true;
          }
        }
      }

      return false;
    });

    if (invalidItems.length > 0) {
      toast.error("Please fill all required fields for each sale item including variants and attributes where applicable")
      return;
    }


    const dateValidationErrors = saleItems.filter(item =>
      new Date(item.endDateTime) <= new Date(item.startDateTime)
    );

    if (dateValidationErrors.length > 0) {
      toast.error("End date must be after start date for all sale items")
      return;
    }

    props.loader(true);

    try {
      const createPromises = saleItems.map((item) => {
        const formattedData = {
          startDateTime: new Date(item.startDateTime).toISOString(),
          endDateTime: new Date(item.endDateTime).toISOString(),
          SellerId: user._id,
          price: parseFloat(item.price),
          availableQty: item.availableQty,
          products: [item.product],
          variant: item.selectedVariant !== "" ? item.selectedVariant : null,
          attribute: item?.selectedAttribute?.attributes
            !== "" ? item?.selectedAttribute?.attributes
            : null,
          originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : null,
          offerPrice: item.offerPrice ? parseFloat(item.offerPrice) : null,
        };
        console.log("Formatted data:", formattedData);
        return Api("post", "sale/createSale", formattedData, router);
      });

      await Promise.all(createPromises);
      props.loader(false);
      toast.success("Sales added successfully!")
      setSaleItems([]);
      router.push("/SaleProduct");
    } catch (error) {
      props.loader(false);
      console.error(error);
      toast.error(error?.message || "An error occurred")
    }
  };

  return (
    <div className="bg-gradient-to-b bg-gray-100 p-6 rounded-lg h-full shadow-lg  overflow-y-scroll scrollbar-hide overflow-scroll pb-44 border border-gray-100">
      <div className="mx-auto md:py-8 py-0 max-w-6xl ">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            Create Sale
          </h2>
          <p className="text-gray-500 text-[13px] mt-1">
            Add sale with individual pricing and timing for each product variant
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <button
              type="button"
              onClick={addSaleItem}
              className="bg-custom-orange text-black py-2 px-4 rounded-lg  transition-colors font-medium flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Sale Item
            </button>
          </div>

          {saleItems.map((item, index) => (
            <div
              key={index}
              className="mb-8 p-6 border border-gray-200 rounded-lg bg-white relative"
            >
              <button
                type="button"
                onClick={() => removeSaleItem(index)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-custom-orange" />
                Sale Item #{index + 1}
              </h3>

              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-2 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-custom-orange" />
                  Select Product *
                </label>
                <Select
                  options={productOptions}
                  value={
                    productOptions.find((opt) => opt.value === item.product) ||
                    null
                  }
                  onChange={(selectedOption) =>
                    updateSaleItem(index, "product", selectedOption?.value || "")
                  }
                  className="text-gray-700"
                  placeholder="Select a product..."
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#127300",
                      },
                      padding: "2px",
                      borderRadius: "0.5rem",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#127300"
                        : state.isFocused
                          ? "rgba(18, 115, 0, 0.1)"
                          : null,
                      ":active": {
                        backgroundColor: "#127300",
                      },
                    }),
                  }}
                />
              </div>

              {item.productDetails && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Product:</strong> {item.productDetails.name} |
                    <strong> Category:</strong> {item.productDetails.categoryName}
                    {item.productDetails.subCategoryName && (
                      <>
                        | <strong> Sub-Category:</strong> {item.productDetails.subCategoryName}
                      </>
                    )}
                  </p>
                  {item.productDetails.varients && item.productDetails.varients.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      This product has {item.productDetails.varients.length} variant(s) available
                    </p>
                  )}
                </div>
              )}

              {item.productDetails && item.productDetails.varients && item.productDetails.varients.length > 0 && (
                <div className="mb-4">
                  <label className="block font-medium text-gray-700 mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-custom-orange" />
                    Select Variant *
                  </label>
                  <Select
                    options={getVariantOptions(item.productDetails)}
                    value={
                      getVariantOptions(item.productDetails).find(
                        (opt) => opt.value === item.variant
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      updateSaleItem(index, "variant", selectedOption?.value ?? "")
                    }
                    className="text-gray-700"
                    classNamePrefix="select"
                    placeholder="Select a variant..."
                    isClearable
                    components={{ Option: VariantOption }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#e5e7eb",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#127300",
                        },
                        padding: "2px",
                        borderRadius: "0.5rem",
                      }),
                    }}
                  />
                </div>
              )}

              {item.selectedVariant && item.selectedVariant.selected && item.selectedVariant.selected.length > 0 && (
                <div className="mb-4">
                  <label className="block font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-custom-orange" />
                    Select Attributes *
                  </label>
                  <Select
                    options={getAttributeOptions(item.selectedVariant)}
                    value={
                      getAttributeOptions(item.selectedVariant).find(
                        (opt) => opt.value === item.attribute
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      updateSaleItem(index, "attribute", selectedOption?.value ?? "")
                    }
                    className="text-gray-700"
                    classNamePrefix="select"
                    placeholder="Select attributes..."
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#e5e7eb",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#127300",
                        },
                        padding: "2px",
                        borderRadius: "0.5rem",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#127300"
                          : state.isFocused
                            ? "rgba(18, 115, 0, 0.1)"
                            : null,
                        ":active": {
                          backgroundColor: "#127300",
                        },
                      }),
                    }}
                  />
                </div>
              )}

              {item.selectedAttribute && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Attribute Details:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {item.selectedAttribute.attributes && item.selectedAttribute.attributes.length > 0 && (
                      <p>
                        <strong>Attributes:</strong> {item.selectedAttribute.attributes.map(a => `${a.label}: ${a.value}`).join(', ')}
                      </p>
                    )}
                    {item.originalPrice && (
                      <p><strong>Original Price:</strong> ${item.originalPrice}</p>
                    )}
                    {item.offerPrice && (
                      <p><strong>Offer Price:</strong> ${item.offerPrice}</p>
                    )}
                    {item.availableQty !== "" && item.availableQty !== null && (
                      <p><strong>Available Quantity:</strong> {item.availableQty}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-custom-orange" />
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={item.startDateTime}
                    onChange={(e) =>
                      updateSaleItem(index, "startDateTime", e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-custom-orange/20 focus:border-custom-orange transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-custom-orange" />
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={item.endDateTime}
                    onChange={(e) =>
                      updateSaleItem(index, "endDateTime", e.target.value)
                    }
                    min={item.startDateTime}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-custom-orange/20 focus:border-custom-orange transition-colors"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium text-gray-700 mb-2 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-custom-orange" />
                  Sale Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateSaleItem(index, "price", e.target.value)
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 pl-8 pr-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-custom-orange/20 focus:border-custom-orange transition-colors"
                  />
                </div>
                {item.offerPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    Original offer price: ${item.offerPrice}
                    {item.price && parseFloat(item.price) >= parseFloat(item.offerPrice) && (
                      <span className="text-black ml-2">⚠️ Sale price should be lower than offer price</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}

          {saleItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                No sale items added yet. Click "Add Sale Item" to get started.
              </p>
            </div>
          )}

          {saleItems.length > 0 && (
            <div className="relative">
              <button
                type="submit"
                className="w-full bg-custom-orange text-black py-3 cursor-pointer px-4 rounded-lg  transition-colors font-medium flex items-center justify-center"
              >
                <span>Create Flash Sales ({saleItems.length} items)</span>
                <Plus className="h-5 w-5 ml-2" />
              </button>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-custom-orange opacity-50 rounded-full"></div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-[13px] text-gray-500">
              Each product variant will have its own flash sale with individual pricing and timing
            </p>
          </div>
        </form>
      </div>
    </div >
  );
}

export default isAuth(AddSale);