import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Api, ApiFormData } from "../services/service";
import { userContext } from "./_app";
import { toast } from "react-toastify";
import Compressor from "compressorjs";
import { 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  Save, 
  ArrowLeft,
  Package,
  Layers,
  Image as ImageIcon,
  CirclePlus,
  Ban,
  SendHorizontal
} from "lucide-react";
import { MdOutlineFileUpload } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import produce from "immer";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { ColorPicker } from "react-color-palette";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

// Editor Config
const editorConfig = {
  readonly: false,
  height: 400,
  toolbarAdaptive: true,
  showCharsCounter: true,
  showWordsCounter: true,
  buttons: [
    "bold", "italic", "underline", "|",
    "ul", "ol", "|",
    "font", "fontsize", "|",
    "align", "undo", "redo", "|",
    "image", "link"
  ],
};

function Products(props) {
  const router = useRouter();
  const [user] = useContext(userContext);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // ============ STATE MANAGEMENT ============
  
  // Basic Product Info
  const [productData, setProductData] = useState({
    name: "",
    category: "",
    categoryName: "",
    subcategory: "",
    subCategoryName: "",
    gender: "",
    short_description: "",
    long_description: "",
    is_manufacturer_product: false,
    productType: "simple", // 'simple' or 'variable'
  });

  // Simple Product Data
  const [simpleProduct, setSimpleProduct] = useState({
    price: "",
    offerPrice: "",
    stock: "",
    sku: "",
    images: []
  });

  // Variable Product Data (New Professional Structure)
  const [varients, setvarients] = useState([{
    color: "",
    image: [],
    selected: [],
  }]);
  
  // Categories
  const [categoryData, setCategoryData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [productsData, setProductsData] = useState({
    category: "",
    categoryName: "",
    subcategory: "",
    subCategoryName: "",
    name: "",
    gender: "",
    parameter_type: "",
    short_description: "",
    long_description: "",
    Attribute: [],
    varients: [],
    is_manufacturer_product: false
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [currentImageUpload, setCurrentImageUpload] = useState(null);
  const [singleImgs, setSingleImgs] = useState([]);
  const [openPopup, setOpenPopup] = useState(false);
  const [color, setColor] = useState({ hex: "#000000" });
  const [selectedColor, setSelectedColor] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Refs
  const fileRefs = useRef([]);
  const forms = useRef(null);

  useEffect(() => {
    getCategory();

  }, []);

  useEffect(() => {
    if (router.isReady && router.query.id) {
      getProductById(router.query.id);
    }
  }, [router.isReady, router.query.id]);

  useEffect(() => {
    if (productsData?.Attribute) {
      if (productsData?.varients?.length) {
        const normalizedVarients = productsData.varients.map((variant) => ({
          ...variant,
          selected: variant.selected?.map((sel) => ({
            attributes: productsData.Attribute.map((attr) => {
              const existingAttr = sel.attributes?.find(
                (a) => a?.label?.toLowerCase() === attr?.name?.toLowerCase()
              );
              return {
                label: attr?.name || "",
                value: existingAttr?.value || ""
              };
            }),
            qty: sel.qty || "",
            price: sel.price || "",
            offerprice: sel.offerprice || ""
          })) || []
        }));

        setvarients(normalizedVarients);
      } else {
        const attrGroup = {
          attributes: productsData.Attribute.map(attr => ({
            label: attr.name,
            value: ""
          })),
          qty: "",
          price: "",
          offerprice: ""
        };

        setvarients([
          {
            color: "",
            image: [],
            selected: [attrGroup]
          }
        ]);
      }
    }
  }, [productData?.Attribute]);


  useEffect(() => {
    fileRefs.current = Array(varients.length)
      .fill()
      .map((_, i) => fileRefs.current[i] || React.createRef());
  }, [varients.length]);

  const handleClose = () => {
    setOpenPopup(false);
  };

  const getCategory = async () => {
    props.loader(true);
    Api("get", "category/getCategories", "", router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);
        if (res?.data) {
          setCategoryData(res?.data);
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.message)
      }
    );
  };

  const getProductById = async (id) => {
    if (!id) {
      console.error("Invalid product ID");
      return;
    }
    props.loader(true);
    Api("get", `product/getProductById/${id}`, "", router).then(
      (res) => {
        props.loader(false);
        if (res?.data) {
          const product = res.data;
          
          console.log("=== PRODUCT LOADED FROM BACKEND ===");
          console.log("Full product data:", product);
          console.log("product.varients:", product.varients);
          console.log("product.variants:", product.variants);
          console.log("product.simpleProduct:", product.simpleProduct);
          console.log("product.productType:", product.productType);

          // Set productsData (legacy)
          setProductsData({
            category: product.category || "",
            categoryName: product.categoryName || "",
            subcategory: product.subcategory || "",
            subCategoryName: product.subCategoryName || "",
            name: product.name || "",
            gender: product.gender || "",
            parameter_type: product.parameter_type || "",
            short_description: product.short_description || "",
            long_description: product.long_description || "",
            Attribute: product.Attribute || [],
            varients: product.varients || [],
            is_manufacturer_product: product.is_manufacturer_product || false
          });

          // Determine product type
          let detectedProductType = "simple";
          if (product.productType) {
            // Use productType from backend if available
            detectedProductType = product.productType;
          } else if (product.simpleProduct && Object.keys(product.simpleProduct).length > 0) {
            // If simpleProduct exists and has data
            detectedProductType = "simple";
          } else if (product.varients && product.varients.length > 0) {
            // If varients exist (legacy)
            detectedProductType = "variable";
          } else if (product.variants && product.variants.length > 0) {
            // If variants exist (new structure)
            detectedProductType = "variable";
          }

          // Set productData (main form state)
          setProductData({
            category: product.category || "",
            categoryName: product.categoryName || "",
            subcategory: product.subcategory || "",
            subCategoryName: product.subCategoryName || "",
            name: product.name || "",
            gender: product.gender || "",
            short_description: product.short_description || "",
            long_description: product.long_description || "",
            is_manufacturer_product: product.is_manufacturer_product || false,
            productType: detectedProductType
          });

          // If simple product, populate simpleProduct state
          if (product.simpleProduct) {
            setSimpleProduct({
              price: product.simpleProduct.price || "",
              offerPrice: product.simpleProduct.offerPrice || "",
              stock: product.simpleProduct.stock || "",
              sku: product.simpleProduct.sku || "",
              images: product.simpleProduct.images || []
            });
          }

          // If variable product, populate varients
          if (product.varients && product.varients.length > 0) {
            console.log("Loading varients:", product.varients);
            setvarients(product.varients);
          } else if (detectedProductType === "variable") {
            // If detected as variable but no varients, initialize with empty structure
            console.log("Variable product but no varients found, initializing empty");
            setvarients([{
              color: "",
              image: [],
              selected: [],
            }]);
          }

          setSelectedCategory(product.category);
          const selectedCategory = categoryData.find(
            (cat) => cat._id === product.category
          );

          setFilteredSubCategories(selectedCategory?.Subcategory || []);
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(err?.message)
      }
    );
  };


  const handleCategoryChange = (e) => {
    const selectedCategoryId = e.target.value;
    setSelectedCategory(selectedCategoryId);

    const selectedCategoryObj = categoryData.find(
      (category) => category._id === selectedCategoryId
    );

    setFilteredSubCategories(
      selectedCategoryObj ? selectedCategoryObj.Subcategory : []
    );

    // Parse attributes if they are stringified
    let parsedAttributes = selectedCategoryObj?.Attribute || [];
    if (parsedAttributes.length > 0 && typeof parsedAttributes[0] === 'string') {
      try {
        parsedAttributes = parsedAttributes.map(attr => {
          let parsed = attr;
          // Parse multiple times if needed
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          return Array.isArray(parsed) ? parsed : [parsed];
        }).flat();
      } catch (e) {
        console.error('Error parsing attributes:', e);
        parsedAttributes = [];
      }
    }

    setProductsData({
      ...productsData,
      category: selectedCategoryId,
      categoryName: selectedCategoryObj ? selectedCategoryObj.name : "",
      subcategory: "",
      subCategoryName: "",
      Attribute: parsedAttributes,
    });
    
    // Also update productData for validation
    setProductData({
      ...productData,
      category: selectedCategoryId,
      categoryName: selectedCategoryObj ? selectedCategoryObj.name : "",
      subcategory: "",
      subCategoryName: "",
    });
  };

  const handleSubCategoryChange = (e) => {
    const selectedSubCategoryId = e.target.value;

    const selectedSubCategoryObj = filteredSubCategories.find(
      (subcategory) => subcategory._id === selectedSubCategoryId
    );

    // Parse attributes if they are stringified
    let parsedAttributes = selectedSubCategoryObj?.Attribute || [];
    if (parsedAttributes.length > 0 && typeof parsedAttributes[0] === 'string') {
      try {
        parsedAttributes = parsedAttributes.map(attr => {
          let parsed = attr;
          // Parse multiple times if needed
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          return Array.isArray(parsed) ? parsed : [parsed];
        }).flat();
      } catch (e) {
        console.error('Error parsing attributes:', e);
        parsedAttributes = [];
      }
    }

    setProductsData((prev) => ({
      ...prev,
      subcategory: selectedSubCategoryId,
      Attribute: parsedAttributes,
      subCategoryName: selectedSubCategoryObj
        ? selectedSubCategoryObj.name
        : "",
    }));
    
    // Also update productData for validation
    setProductData((prev) => ({
      ...prev,
      subcategory: selectedSubCategoryId,
      subCategoryName: selectedSubCategoryObj
        ? selectedSubCategoryObj.name
        : "",
    }));
  };


  useEffect(() => {
    if (productsData?.category && categoryData?.length) {
      const matchedCategory = categoryData.find(
        (cat) => cat._id === productsData.category._id
      );

      if (matchedCategory) {
        setSelectedCategory(matchedCategory._id);
        setFilteredSubCategories(matchedCategory.Subcategory || []);

        const matchedSubCategory = matchedCategory.Subcategory?.find(
          (sub) => sub._id === productsData.subcategory
        );

        setProductsData((prev) => ({
          ...prev,
          category: matchedCategory,
          subcategory: matchedSubCategory?._id || prev.subcategory,
        }));
      }
    }

  }, [productsData?.category, categoryData,]);


  const createProduct = async (e) => {
    e.preventDefault();

    console.log("=== VALIDATION DEBUG ===");
    console.log("productData:", productData);
    console.log("productsData:", productsData);
    console.log("selectedCategory:", selectedCategory);

    // Validation - use selectedCategory as fallback
    const categoryToUse = productData.category || selectedCategory;
    
    if (!productData.name || !categoryToUse) {
      toast.error("Please fill all required fields");
      return;
    }

    // Get category and subcategory names
    const selectedCategoryObj = categoryData.find(c => c._id === categoryToUse);
    const selectedSubcategoryObj = filteredSubCategories.find(s => s._id === (productData.subcategory || productsData.subcategory));

    // Prepare data based on product type
    const payload = {
      ...productData,
      category: categoryToUse,
      categoryName: selectedCategoryObj?.name || productData.categoryName || productsData.categoryName || "",
      subcategory: productData.subcategory || productsData.subcategory || "",
      subCategoryName: selectedSubcategoryObj?.name || productData.subCategoryName || productsData.subCategoryName || "",
      SellerId: user._id,
    };

    if (productData.productType === 'simple') {
      // Simple Product
      if (!simpleProduct.price || !simpleProduct.stock) {
        toast.error("Please enter price and stock");
        return;
      }
      
      // Validate images for simple product
      if (!simpleProduct.images || simpleProduct.images.length === 0) {
        toast.error("Please upload at least one product image");
        return;
      }
      
      payload.simpleProduct = {
        price: parseFloat(simpleProduct.price),
        offerPrice: parseFloat(simpleProduct.offerPrice) || parseFloat(simpleProduct.price),
        stock: parseInt(simpleProduct.stock),
        sku: simpleProduct.sku || '',
        images: simpleProduct.images
      };
      payload.variants = [];
      payload.pieces = parseInt(simpleProduct.stock);
      
    } else {
      // Variable Product (Legacy support)
      if (!varients || varients.length === 0) {
        toast.error("Please add at least one variant");
        return;
      }
      
      // Validate that EVERY variant has at least one image
      const variantsWithoutImages = [];
      varients.forEach((varient, index) => {
        if (!varient.image || varient.image.length === 0) {
          variantsWithoutImages.push(index + 1); // Store 1-based index
        }
      });
      
      if (variantsWithoutImages.length > 0) {
        const variantNumbers = variantsWithoutImages.join(', ');
        toast.error(`Please upload images for variant(s): ${variantNumbers}`);
        return;
      }
      
      // Validate that every variant has at least one selected option
      const variantsWithoutOptions = [];
      varients.forEach((varient, index) => {
        if (!varient.selected || varient.selected.length === 0) {
          variantsWithoutOptions.push(index + 1);
        }
      });
      
      if (variantsWithoutOptions.length > 0) {
        const variantNumbers = variantsWithoutOptions.join(', ');
        toast.error(`Please add options (size/attributes) for variant(s): ${variantNumbers}`);
        return;
      }
      
      const sumWithInitial = varients.reduce(
        (accumulator, currentValue) =>
          accumulator +
          currentValue.selected.reduce(
            (total, currentVal) => total + (Number(currentVal.qty) || 0),
            0
          ),
        0
      );
      
      // Convert old varients structure to new variants structure
      const convertedVariants = [];
      varients.forEach(varient => {
        varient.selected.forEach(sel => {
          // Convert attributes from {label, value} to {name, value}
          const convertedAttributes = (sel.attributes || []).map(attr => ({
            name: attr.label || attr.name || '',
            value: attr.value || ''
          }));
          
          convertedVariants.push({
            attributes: convertedAttributes,
            sku: sel.sku || '',
            images: varient.image || [],
            price: parseFloat(sel.price) || 0,
            offerPrice: parseFloat(sel.offerprice) || parseFloat(sel.price) || 0,
            stock: parseInt(sel.qty) || 0,
            isActive: true
          });
        });
      });
      
      // Send both old and new structure for backward compatibility
      payload.varients = varients;  // Old structure
      payload.variants = convertedVariants;  // New structure (backend expects this)
      payload.pieces = sumWithInitial;
    }

    props.loader(true);
    console.log("Creating product with data:", payload);

    Api("post", "product/createProduct", payload, router).then(
      (res) => {
        props.loader(false);
        if (res.status) {
          toast.success(res?.data?.message || "Product created successfully");
          
          // Reset form
          setProductData({
            category: "",
            categoryName: "",
            subcategory: "",
            subCategoryName: "",
            name: "",
            gender: "",
            short_description: "",
            long_description: "",
            is_manufacturer_product: false,
            productType: "simple",
          });
          
          setSimpleProduct({
            price: "",
            offerPrice: "",
            stock: "",
            sku: "",
            images: []
          });
          
          setvarients([{
            color: "",
            image: [],
            selected: [],
          }]);

          router.push("/inventory");
        } else {
          toast.error(res?.data?.message || "Failed to create product");
        }
      },
      (err) => {
        props.loader(false);
        console.error(err);
        toast.error(err?.message || "An error occurred");
      }
    );
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    // Validation - use selectedCategory as fallback
    const categoryToUse = productData.category || selectedCategory;
    
    if (!productData.name || !categoryToUse) {
      toast.error("Please fill all required fields");
      return;
    }

    // Get category and subcategory names
    const selectedCategoryObj = categoryData.find(c => c._id === categoryToUse);
    const selectedSubcategoryObj = filteredSubCategories.find(s => s._id === (productData.subcategory || productsData.subcategory));

    // Prepare data based on product type
    const payload = {
      ...productData,
      category: categoryToUse,
      categoryName: selectedCategoryObj?.name || productData.categoryName || productsData.categoryName || "",
      subcategory: productData.subcategory || productsData.subcategory || "",
      subCategoryName: selectedSubcategoryObj?.name || productData.subCategoryName || productsData.subCategoryName || "",
      SellerId: user._id,
      id: router.query.id,
    };

    if (productData.productType === 'simple') {
      // Simple Product
      if (!simpleProduct.price || !simpleProduct.stock) {
        toast.error("Please enter price and stock");
        return;
      }
      
      // Validate images for simple product
      if (!simpleProduct.images || simpleProduct.images.length === 0) {
        toast.error("Please upload at least one product image");
        return;
      }
      
      payload.simpleProduct = {
        price: parseFloat(simpleProduct.price),
        offerPrice: parseFloat(simpleProduct.offerPrice) || parseFloat(simpleProduct.price),
        stock: parseInt(simpleProduct.stock),
        sku: simpleProduct.sku || '',
        images: simpleProduct.images
      };
      payload.variants = [];
      payload.pieces = parseInt(simpleProduct.stock);
      
    } else {
      // Variable Product (Legacy support)
      console.log("Validating variable product, varients:", varients);
      
      // Check if varients exist and have valid data
      const hasValidVarients = varients && varients.length > 0 && 
        varients.some(v => v.selected && v.selected.length > 0);
      
      if (!hasValidVarients) {
        toast.error("Variable products must have at least one variant");
        return;
      }
      
      // Validate that EVERY variant has at least one image
      const variantsWithoutImages = [];
      varients.forEach((varient, index) => {
        if (!varient.image || varient.image.length === 0) {
          variantsWithoutImages.push(index + 1); // Store 1-based index
        }
      });
      
      if (variantsWithoutImages.length > 0) {
        const variantNumbers = variantsWithoutImages.join(', ');
        toast.error(`Please upload images for variant(s): ${variantNumbers}`);
        return;
      }
      
      // Validate that every variant has at least one selected option
      const variantsWithoutOptions = [];
      varients.forEach((varient, index) => {
        if (!varient.selected || varient.selected.length === 0) {
          variantsWithoutOptions.push(index + 1);
        }
      });
      
      if (variantsWithoutOptions.length > 0) {
        const variantNumbers = variantsWithoutOptions.join(', ');
        toast.error(`Please add options (size/attributes) for variant(s): ${variantNumbers}`);
        return;
      }
      
      const sumWithInitial = varients.reduce(
        (accumulator, currentValue) =>
          accumulator +
          currentValue.selected.reduce(
            (total, currentVal) => total + (Number(currentVal.qty) || 0),
            0
          ),
        0
      );
      
      // Convert old varients structure to new variants structure
      const convertedVariants = [];
      varients.forEach(varient => {
        varient.selected.forEach(sel => {
          // Convert attributes from {label, value} to {name, value}
          const convertedAttributes = (sel.attributes || []).map(attr => ({
            name: attr.label || attr.name || '',
            value: attr.value || ''
          }));
          
          convertedVariants.push({
            attributes: convertedAttributes,
            sku: sel.sku || '',
            images: varient.image || [],
            price: parseFloat(sel.price) || 0,
            offerPrice: parseFloat(sel.offerprice) || parseFloat(sel.price) || 0,
            stock: parseInt(sel.qty) || 0,
            isActive: true
          });
        });
      });
      
      console.log("Converted variants:", convertedVariants);
      
      // Send both old and new structure for backward compatibility
      payload.varients = varients;  // Old structure
      payload.variants = convertedVariants;  // New structure (backend expects this)
      payload.pieces = sumWithInitial;
    }

    props.loader(true);
    console.log("Updating product with data:", payload);

    Api("post", "product/updateProduct", payload, router).then(
      (res) => {
        props.loader(false);

        if (res.status) {
          toast.success(res?.data?.message || "Product updated successfully");
          router.push("/inventory");
        } else {
          toast.error(res?.data?.message || "Failed to update product");
        }
      },
      (err) => {
        props.loader(false);
        console.error(err);
        toast.error(err?.message || "An error occurred");
      }
    );
  };

  const handleImageUpload = async (file, callback) => {
    if (!file) return;

    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb > 2) {
      toast.error("File too large. Maximum 2MB allowed");
      return;
    }

    new Compressor(file, {
      quality: 0.7,
      success: async (compressedFile) => {
        const formData = new FormData();
        formData.append("file", compressedFile);
        props.loader(true);

        try {
          const res = await ApiFormData("post", "user/fileupload", formData, router);
          props.loader(false);
          
          if (res.status) {
            const imageUrl = res.data.file || res.data.fileUrl;
            callback(imageUrl);
            toast.success("Image uploaded");
          }
        } catch (err) {
          props.loader(false);
          toast.error(err?.message || "Upload failed");
        }
      }
    });
  };

  const handleImageChange = (event, index) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb > 1) {
      toast.error("Too large file. Please upload a smaller image")
      return;
    }

    new Compressor(file, {
      quality: 0.6,
      success: (compressedResult) => {
        const data = new FormData();
        data.append("file", compressedResult);
        props.loader(true);

        ApiFormData("post", "user/fileupload", data, router).then(
          (res) => {
            props.loader(false);
            if (res.status) {
              const updatedImgs = [...singleImgs];
              updatedImgs[index] = res.data.file || res.data.fileUrl;
              setSingleImgs(updatedImgs);
              toast.success('File uploaded successfully')
            }
          },
          (err) => {
            props.loader(false);
            console.log(err);
            toast.error(err?.message)
          }
        );
      },
    });
  };

  const closeIcon = (item, inx, imagesArr, i) => {
    console.log(item);
    console.log(varients[i]);

    const nextState = produce(imagesArr, (draftState) => {
      if (inx !== -1) {
        draftState.splice(inx, 1);
      }
    });
    console.log(nextState);

    setvarients(
      produce((draft) => {
        console.log(draft);
        draft[i].image = nextState;
      })
    );
  };

  const colorCloseIcon = (item, i) => {
    let data = [];
    varients.forEach((item, inx) => {
      if (inx !== i) data.push(item);
    });
    setvarients([...data]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductsData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditorBlur = useCallback((newContent) => {
    setProductData((prev) => ({
      ...prev,
      long_description: newContent
    }));
  }, []);


  const Cancel = () => {
    setProductsData({
      category: "",
      categoryName: "",
      subcategory: "",
      subCategoryName: "",
      name: "",
      img: "",
      gender: "",
      short_description: "",
      long_description: "",
      is_manufacturer_product: false,
    });

    setvarients([
      {
        color: "",
        image: [],
        selected: [],
      },
    ]);
    setSingleImgs("")
    setSelectedCategory("");
    setFilteredSubCategories([]);
  }
  return (
    <section className="bg-gray-100 w-full h-full  !p-4 !md:p-5 ">
      <div className=" h-full">
        <h1 className="text-2xl md:text-3xl font-semibold text-black  md:mt-2 mt-5 md:mb-5 mb-5">
          {router.query.id ? "Update Product" : "Add Product"}
        </h1>

        <div className="h-full bg-white rounded-[15px] p-5 overflow-y-scroll scrollbar-hide overflow-scroll pb-36">
          <form
            ref={forms}
            className="w-full border-b-4 border-gray-400 pb-5"
            onSubmit={router.query.id ? updateProduct : createProduct}
          >
            <div className="grid md:grid-cols-2 grid-cols-1 w-full gap-5">
              <div className="flex flex-col justify-start items-start mb-2">
                <p className="text-gray-800 text-[16px] font-semibold NunitoSans pb-2">
                  Category <span className="text-red-500">*</span>
                </p>
                <div className="w-full bg-white ">
                  <select
                    className="w-full  md:py-[14px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black "
                    value={productData.category || selectedCategory}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categoryData.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col justify-start items-start mb-2">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Sub Category <span className="text-red-500">*</span>
                </p>
                <div className="w-full ">
                  <select
                    className="w-full md:py-[14px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                    value={productData.subcategory || productsData?.subcategory || ""}
                    onChange={handleSubCategoryChange}
                    disabled={!selectedCategory || selectedCategory?.notAvailableSubCategory}
                    required={selectedCategory?.notAvailableSubCategory === false}
                  >
                    <option value="" disabled>
                      Select Sub Category
                    </option>
                    {filteredSubCategories?.map((subcategory) => (
                      <option key={subcategory._id} value={subcategory._id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Product Name
                </p>
                <input
                  type="text"
                  className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                  placeholder="Enter Product Name"
                  value={productData.name}
                  name="name"
                  onChange={(e) => setProductData({...productData, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex flex-col justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Gender
                </p>
                <div className=" w-full ">
                  <select
                    name="gender"
                    onChange={(e) => setProductData({...productData, gender: e.target.value})}
                    value={productData.gender}
                    className="w-full md:py-[14px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                    placeholder="Select Parameter Type"
                  >
                    <option value="" className="p-5">
                      Select Gender
                    </option>
                    <option value="Male" className="p-5">
                      Male
                    </option>
                    <option value="Female" className="p-5">
                      Female
                    </option>
                    <option value="Unisex" className="p-5">
                      Unisex
                    </option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Product Type <span className="text-red-500">*</span>
                </p>
                <div className="w-full">
                  <select
                    name="is_manufacturer_product"
                    onChange={(e) => {
                      setProductData({
                        ...productData,
                        is_manufacturer_product: e.target.value === 'true'
                      });
                    }}
                    value={productData.is_manufacturer_product.toString()}
                    className="w-full md:py-[14px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                    required
                  >
                    <option value="false">General Product (Marketplace)</option>
                    <option value="true">Manufacturer Product</option>
                  </select>
                </div>
              </div>

              {/* NEW: Variant Type Selection */}
              <div className="flex flex-col justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Variant Type <span className="text-red-500">*</span>
                </p>
                <div className="w-full">
                  <select
                    name="productType"
                    onChange={(e) => {
                      setProductData({
                        ...productData,
                        productType: e.target.value
                      });
                    }}
                    value={productData.productType}
                    className="w-full md:py-[14px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                    required
                  >
                    <option value="simple">Simple Product (Single Price & Stock)</option>
                    <option value="variable">Variable Product (Multiple Variants)</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {productData.productType === 'simple' 
                    ? '✓ One price, one stock quantity' 
                    : '✓ Multiple colors, sizes with different prices & stocks'}
                </p>
              </div>
              
              <div className="flex flex-col col-span-2 justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Short Description
                </p>
                <input
                  type="text"
                  className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                  placeholder="Enter Short Description"
                  value={productData.short_description}
                  name="short_description"
                  onChange={(e) => setProductData({...productData, short_description: e.target.value})}
                />
              </div>

              <div className="flex flex-col justify-start items-start md:col-span-2">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Long Description
                </p>
                <div className="w-full text-black">
                  <JoditEditor
                    ref={editorRef}
                    key={`editor-${router.query.id || 'new'}`}
                    className="editor max-h-screen overflow-auto"
                    rows={10}
                    config={editorConfig}
                    value={productData.long_description}
                    tabIndex={1}
                    onBlur={handleEditorBlur}
                  />
                </div>
              </div>
            </div>

            {/* SIMPLE PRODUCT FORM */}
            {productData.productType === 'simple' && (
              <div className="border-2 border-blue-500 rounded-[12px] md:mt-10 mt-5 p-6 bg-blue-50">
                <h3 className="text-black text-2xl font-bold NunitoSans pb-5 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Simple Product Details
                </h3>
                
                <div className="grid md:grid-cols-3 grid-cols-1 gap-5">
                  <div>
                    <p className="text-gray-800 text-sm font-semibold mb-2">
                      Price <span className="text-red-500">*</span>
                    </p>
                    <input
                      type="number"
                      placeholder="Enter Price"
                      required
                      className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                      value={simpleProduct.price}
                      onChange={(e) => setSimpleProduct({...simpleProduct, price: e.target.value})}
                    />
                  </div>

                  <div>
                    <p className="text-gray-800 text-sm font-semibold mb-2">
                      Offer Price <span className="text-red-500">*</span>
                    </p>
                    <input
                      type="number"
                      placeholder="Enter Offer Price"
                      required
                      className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                      value={simpleProduct.offerPrice}
                      onChange={(e) => setSimpleProduct({...simpleProduct, offerPrice: e.target.value})}
                    />
                  </div>

                  <div>
                    <p className="text-gray-800 text-sm font-semibold mb-2">
                      Stock Quantity <span className="text-red-500">*</span>
                    </p>
                    <input
                      type="number"
                      placeholder="Enter Stock"
                      required
                      className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                      value={simpleProduct.stock}
                      onChange={(e) => setSimpleProduct({...simpleProduct, stock: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <p className="text-gray-800 text-sm font-semibold mb-2">
                      SKU (Optional)
                    </p>
                    <input
                      type="text"
                      placeholder="Enter SKU"
                      className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040] outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                      value={simpleProduct.sku}
                      onChange={(e) => setSimpleProduct({...simpleProduct, sku: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <p className="text-gray-800 text-sm font-semibold mb-2">
                      Product Images <span className="text-red-500">*</span>
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {simpleProduct.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-24 h-24 object-cover rounded-lg border-2" />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = simpleProduct.images.filter((_, i) => i !== idx);
                              setSimpleProduct({...simpleProduct, images: newImages});
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImageUpload(file, (url) => {
                                setSimpleProduct({
                                  ...simpleProduct,
                                  images: [...simpleProduct.images, url]
                                });
                              });
                            }
                          }}
                        />
                        <Upload className="w-6 h-6 text-gray-400" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VARIABLE PRODUCT FORM */}
            {productData.productType === 'variable' && (
            <div className="border border-custom-lightGrays rounded-[8px] md:mt-10 mt-5 px-5 pt-5">
              <p className="text-black text-2xl font-bold NunitoSans pb-5">
                Varients
              </p>
              {varients.map((item, i) => (
                  <div key={i} className="w-full" id={i}>
                    <div className="border border-custom-lightGrays rounded-[8px] p-5 mb-5 relative">
                      <div className="flex justify-between items-center mb-5">
                        <p className="text-black text-lg font-bold NunitoSans">
                          Varient {i + 1}
                        </p>
                        {varients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedVarients = varients.filter((_, index) => index !== i);
                              setvarients(updatedVarients);
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                        <div>
                          <p className="text-gray-800 text-sm font-semibold mb-2">
                            Color <span className="text-red-500">*</span>
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={item.color || "#000000"}
                              onChange={(e) => {
                                const updatedVarients = [...varients];
                                updatedVarients[i].color = e.target.value;
                                setvarients(updatedVarients);
                              }}
                              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              placeholder="Color Name or Hex Code"
                              value={item.color}
                              onChange={(e) => {
                                const updatedVarients = [...varients];
                                updatedVarients[i].color = e.target.value;
                                setvarients(updatedVarients);
                              }}
                              className="flex-1 py-2 px-3 bg-white text-black border-2 border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-800 text-sm font-semibold mb-2">
                            Images
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {item.image.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative">
                                <img
                                  src={img}
                                  alt=""
                                  className="w-16 h-16 object-cover rounded-lg border-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedVarients = [...varients];
                                    updatedVarients[i].image = updatedVarients[i].image.filter((_, idx) => idx !== imgIdx);
                                    setvarients(updatedVarients);
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleImageUpload(file, (url) => {
                                      const updatedVarients = [...varients];
                                      updatedVarients[i].image.push(url);
                                      setvarients(updatedVarients);
                                    });
                                  }
                                }}
                              />
                              <Upload className="w-4 h-4 text-gray-400" />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Attributes Section */}
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-gray-800 text-sm font-semibold">
                            Attributes (Size, etc.)
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedVarients = [...varients];
                              updatedVarients[i].selected.push({
                                attributes: [],
                                price: "",
                                offerprice: "",
                                qty: "",
                              });
                              setvarients(updatedVarients);
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            <Plus className="w-4 h-4" />
                            Add Attribute
                          </button>
                        </div>

                        {item.selected.map((selected, selectedIdx) => (
                          <div
                            key={selectedIdx}
                            className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                          >
                            <div className="flex justify-between text-gray-600 items-center mb-3">
                              <p className="font-semibold text-sm">
                                Attribute Set {selectedIdx + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedVarients = [...varients];
                                  updatedVarients[i].selected = updatedVarients[i].selected.filter((_, idx) => idx !== selectedIdx);
                                  setvarients(updatedVarients);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Dynamic Attributes */}
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3 mb-3">
                              {selected.attributes.map((attr, attrIdx) => (
                                <div key={attrIdx} className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Attribute Name (e.g., Size)"
                                    value={attr.label || ""}
                                    onChange={(e) => {
                                      const updatedVarients = [...varients];
                                      updatedVarients[i].selected[selectedIdx].attributes[attrIdx].label = e.target.value;
                                      setvarients(updatedVarients);
                                    }}
                                    className="flex-1 py-2 px-3 bg-white text-black border border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value (e.g., M, L, XL)"
                                    value={attr.value || ""}
                                    onChange={(e) => {
                                      const updatedVarients = [...varients];
                                      updatedVarients[i].selected[selectedIdx].attributes[attrIdx].value = e.target.value;
                                      setvarients(updatedVarients);
                                    }}
                                    className="flex-1 py-2 px-3 bg-white text-black border border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedVarients = [...varients];
                                      updatedVarients[i].selected[selectedIdx].attributes = updatedVarients[i].selected[selectedIdx].attributes.filter((_, idx) => idx !== attrIdx);
                                      setvarients(updatedVarients);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedVarients = [...varients];
                                  updatedVarients[i].selected[selectedIdx].attributes.push({ label: "", value: "" });
                                  setvarients(updatedVarients);
                                }}
                                className="flex items-center text-gray-700 justify-center gap-2 py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
                              >
                                <Plus className="w-4 h-4" />
                                Add Attribute
                              </button>
                            </div>

                            {/* Price & Stock */}
                            <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                              <div>
                                <p className="text-xs font-semibold mb-1 text-gray-800">
                                  Price <span className="text-red-500">*</span>
                                </p>
                                <input
                                  type="number"
                                  placeholder="Enter Price"
                                  value={selected.price}
                                  onChange={(e) => {
                                    const updatedVarients = [...varients];
                                    updatedVarients[i].selected[selectedIdx].price = e.target.value;
                                    setvarients(updatedVarients);
                                  }}
                                  className="w-full py-2 px-3 bg-white text-black border border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-semibold mb-1 text-gray-800">
                                  Offer Price <span className="text-red-500">*</span>
                                </p>
                                <input
                                  type="number"
                                  placeholder="Enter Offer Price"
                                  value={selected.offerprice}
                                  onChange={(e) => {
                                    const updatedVarients = [...varients];
                                    updatedVarients[i].selected[selectedIdx].offerprice = e.target.value;
                                    setvarients(updatedVarients);
                                  }}
                                  className="w-full py-2 px-3 bg-white text-black border border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-semibold mb-1 text-gray-800">
                                  Stock <span className="text-red-500">*</span>
                                </p>
                                <input
                                  type="number"
                                  placeholder="Enter Stock Quantity"
                                  value={selected.qty}
                                  onChange={(e) => {
                                    const updatedVarients = [...varients];
                                    updatedVarients[i].selected[selectedIdx].qty = e.target.value;
                                    setvarients(updatedVarients);
                                  }}
                                  className="w-full py-2 px-3 bg-white text-black border border-gray-300 rounded-lg outline-none focus:border-orange-500 placeholder-gray-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              }

              <div className="flex justify-center items-center pb-5">
                <p
                  className="text-black text-lg font-bold NunitoSans cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-400 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
                  onClick={() => {
                    setvarients([
                      ...varients,
                      {
                        color: "",
                        image: [],
                        selected: [],
                      },
                    ]);
                  }}
                >
                  Add More Varients <CirclePlus />
                </p>
              </div>

            </div>
            )}
            {/* END VARIABLE PRODUCT FORM */}

            <div className="flex justify-center items-center md:mt-10 mt-5 gap-5">
              <button
                className="bg-custom-orange md:h-[45px] cursor-pointer h-[40px] w-[177px] shadow-[2px_4px_6px_0px_#00000040] rounded-[12px] NunitoSans text-black font-normal text-base flex justify-center items-center gap-2"
                onClick={() => Cancel()}
              >
                Cancel <Ban />
              </button>
              <button
                className="bg-custom-orange md:h-[45px] h-[40px] w-[177px] shadow-[2px_4px_6px_0px_#00000040]  rounded-[12px] NunitoSans text-black cursor-pointer font-normal text-base flex justify-center items-center gap-2"
                type="submit"
              >
                {router.query.id ? "Update" : "Submit"} <SendHorizontal size={18} />
              </button>

            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Products;
