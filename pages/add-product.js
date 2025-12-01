import Table from "@/components/table";
import { Api, ApiFormData } from "../services/service";
import React, { useState, useMemo, useEffect, useRef, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { MdOutlineFileUpload } from "react-icons/md";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import _ from "underscore";
import { produce } from "immer";
import { IoCloseCircleOutline } from "react-icons/io5";
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
import dynamic from "next/dynamic";
import Compressor from "compressorjs";
import { Ban, CirclePlus, Plus, SendHorizontal } from "lucide-react";
import { userContext } from "./_app";
import { toast } from "react-toastify";

const config = {
  readonly: false,
  height: 500,
  toolbarAdaptive: true,
  toolbarSticky: true,
  showCharsCounter: true,
  showWordsCounter: true,
  showXPathInStatusbar: true,
  buttons: [
    "source", "|",
    "bold", "italic", "underline", "strikethrough", "|",
    "superscript", "subscript", "|",
    "ul", "ol", "outdent", "indent", "|",
    "font", "fontsize", "brush", "paragraph", "|",
    "image", "file", "video", "table", "link", "hr", "|",
    "align", "undo", "redo", "cut", "copy", "paste", "|",
    "selectall", "find", "replace", "|",
    "fullsize", "preview", "print", "about", "spellcheck"
  ],
};

function Products(props) {
  const router = useRouter();
  const fileRefs = useRef([]);

  const [productsData, setProductsData] = useState({
    category: "",
    subcategory: "",
    categoryName: "",
    parameter_type: "",
    subCategoryName: "",
    gender: "",
    name: "",
    short_description: "",
    long_description: "",
    Quantity: "",
  });
  
  // Memoize the editor config to prevent re-renders
  const editorConfig = useMemo(() => ({
    ...config,
    readonly: false,
    placeholder: !productsData.long_description ? "Start writing..." : "",
  }), [productsData.long_description]);

  // Handle editor content change
  const handleEditorChange = useCallback((newContent) => {
    setProductsData(prev => ({
      ...prev,
      long_description: newContent
    }));
  }, []);

  const [varients, setvarients] = useState([
    {
      color: "",
      image: [],
      selected: [],
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [color, setColor] = useColor("#000000");
  const [user] = useContext(userContext)
  const [openPopup, setOpenPopup] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const forms = useRef();
  const [singleImgs, setSingleImgs] = useState("");
  const [value, setValue] = useState("");
  const [filterCategoryData, setFilterCategoryData] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);

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
                (a) => a.label.toLowerCase() === attr.name.toLowerCase()
              );
              return {
                label: attr.name,
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
  }, [productsData?.Attribute]);


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
            varients: product.varients || []
          });


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

    setProductsData({
      ...productsData,
      category: selectedCategoryId,
      categoryName: selectedCategoryObj ? selectedCategoryObj.name : "",
      subcategory: "",
      subCategoryName: "",
      Attribute: selectedCategoryObj?.Attribute || [],
    });
  };

  const handleSubCategoryChange = (e) => {
    const selectedSubCategoryId = e.target.value;

    const selectedSubCategoryObj = filteredSubCategories.find(
      (subcategory) => subcategory._id === selectedSubCategoryId
    );

    setProductsData((prev) => ({
      ...prev,
      subcategory: selectedSubCategoryId,
      Attribute: selectedSubCategoryObj?.Attribute || [],
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

    const sumWithInitial = varients.reduce(
      (accumulator, currentValue) =>
        accumulator +
        currentValue.selected.reduce(
          (total, currentVal) =>
            total + (Number(currentVal.qty) || 0),
          0
        ),
      0
    );

    const data = {
      ...productsData,
      varients,
      SellerId: user._id,
      pieces: sumWithInitial,
    };

    props.loader(true);

    console.log("data================>", data);
    Api("post", "product/createProduct", data, router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);
        if (res.status) {

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
          });

          setvarients([
            {
              color: "",
              image: [],
              selected: [],
            },
          ]);

          setSelectedCategory("");
          setFilteredSubCategories([]);

          router.push("/inventory");
          toast.success(res?.data?.message)
        } else {
          toast.error(res?.data?.message)
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(res?.message)
      }
    );
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    const sumWithInitial = varients.reduce(
      (accumulator, currentValue) =>
        accumulator +
        currentValue.selected.reduce(
          (total, currentVal) => total + Number(currentVal.qty),
          0
        ),
      0
    );

    const data = {
      ...productsData,
      varients,
      SellerId: user._id,
      pieces: sumWithInitial,
      id: router.query.id,
    };

    props.loader(true);

    Api("post", "product/updateProduct", data, router).then(
      (res) => {
        props.loader(false);
        console.log("res================>", res);

        if (res.status) {
          setProductsData({
            category: "",
            categoryName: "",
            subcategory: "",
            subCategoryName: "",
            name: "",
            price: "",
            gender: "",
            img: "",
            short_description: "",
            long_description: "",
            theme: "",
            themeName: "",
            decoration_method: [],
            decoration_location: [],
          });

          setvarients([
            {
              color: "",
              image: [],
              selected: [],
            },
          ]);

          setSelectedCategory("");
          setFilteredSubCategories([]);
          router.push("/inventory");
          toast.success(res?.data?.message)
        } else {
          toast.error(res?.data?.message)
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        toast.error(res?.message)
      }
    );
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

                    value={selectedCategory}
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
                    value={productsData?.subcategory || ""}
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
                  value={productsData.name}
                  name="name"
                  onChange={handleChange}
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
                    onChange={handleChange}
                    value={productsData.gender}
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
              <div className="flex flex-col col-span-2 justify-start items-start">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Short Description
                </p>
                <input
                  type="text"
                  className="w-full md:py-[12px] py-2 px-[10px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                  placeholder="Enter Short Description"
                  value={productsData.short_description}
                  name="short_description"
                  onChange={handleChange}
                />
              </div>

              <div className="flex flex-col justify-start items-start md:col-span-2">
                <p className="text-gray-800 text-sm font-semibold NunitoSans pb-2">
                  Long Description
                </p>
                <div className="w-full text-black">
                  <JoditEditor
                    key="jodit-editor"
                    className="editor max-h-screen overflow-auto"
                    rows={10}
                    config={editorConfig}
                    value={productsData.long_description}
                    onChange={handleEditorChange}

                  />
                </div>
              </div>
            </div>

            <div className="border border-custom-lightGrays rounded-[8px] md:mt-10 mt-5 px-5 pt-5">
              <p className="text-black text-2xl font-bold	NunitoSans pb-5">
                Varients
              </p>
              {
                varients.map((item, i) => (
                  <div key={i} className="w-full" id={i}>
                    <div className="border border-custom-lightGrays  rounded-[8px] p-5 mb-5 relative">
                      <IoCloseCircleOutline
                        className="text-red-700 cursor-pointer h-5 w-5 absolute top-[20px] right-[20px]"
                        onClick={() => {
                          colorCloseIcon(item, i);
                        }}
                      />
                      <div
                        className="md:grid md:grid-cols-5 grid-cols-1 w-full md:gap-5"
                        id={"field-container-" + i}
                      >
                        {productsData?.Attribute?.some(attr => attr?.name?.toLowerCase?.() === "color") && (
                          <div className="">
                            <p className="text-gray-800 text-sm font-semibold NunitoSans pb-[10px] pl-[40px]">
                              Color
                            </p>
                            <div className="flex justify-start items-center">
                              <p className="text-gray-800 text-sm font-semibold w-[100px]">
                                S.no {i + 1}
                              </p>
                              <div className="relative w-full">
                                <input
                                  type="text"
                                  className="md:py-[12px] py-2 w-[150px] bg-white border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] text-black"
                                  value={item.color}
                                  onChange={(e) => {
                                    setvarients(
                                      produce((draft) => {
                                        draft[i].color = e.target.value;
                                      })
                                    );
                                  }}

                                />
                                <p
                                  className=" md:w-5 w-3 md:h-5 h-3 rounded-full absolute top-[13px] right-[10px] cursor-pointer border border-black"
                                  style={{ backgroundColor: item.color }}
                                  onClick={() => {
                                    setOpenPopup(true);
                                    setCurrentIndex(i);
                                  }}
                                ></p>
                                <Dialog
                                  open={openPopup}
                                  onClose={handleClose}
                                  aria-labelledby="draggable-dialog-title"
                                >
                                  <div className="md:w-[400px] w-[330px]">
                                    <DialogTitle
                                      style={{ cursor: "move" }}
                                      id="draggable-dialog-title"
                                    >
                                      <p className="text-black font-bold text-xl text-center">
                                        Color Picker
                                      </p>
                                    </DialogTitle>
                                    <DialogContent>
                                      <ColorPicker
                                        color={color}
                                        onChange={setColor}
                                      />
                                    </DialogContent>
                                    <DialogActions className="!p-0 !flex !justify-center !items-center">
                                      <div className="!flex !justify-center !items-center px-[24px] pb-[24px] w-full gap-3">
                                        <button
                                          className="bg-custom-orange h-[45px] w-full rounded-[12px] NunitoSans text-black font-normal text-base cursor-pointer"
                                          onClick={() => {
                                            setvarients(
                                              produce((draft) => {
                                                draft[i].color = color.hex;
                                              })
                                            );
                                            setvarients(
                                              produce((draft) => {
                                                draft[i].selected.forEach((sel) => {
                                                  sel.attributes?.forEach((attr) => {
                                                    if (attr.label?.toLowerCase() === "color") {
                                                      attr.value = color.hex;
                                                    }
                                                  });
                                                });
                                              })
                                            );
                                            setSelectedColor(color.hex)
                                            setOpenPopup(false);
                                          }}
                                        >
                                          Ok
                                        </button>
                                        <button
                                          className="bg-custom-orange h-[45px] w-full rounded-[12px] NunitoSans text-black font-normal text-base cursor-pointer"
                                          onClick={handleClose}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </DialogActions>
                                  </div>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {item.selected?.map((attrGroup, setIndex) => (
                        <div
                          key={setIndex}
                          className=" mt-4 grid grid-cols-1 gap-4 mb-6 border border-gray-300 p-4 rounded"
                        >
                          <div className=" relative grid md:grid-cols-4 grid-cols-1 gap-4">
                            <IoCloseCircleOutline
                              className="absolute top-0 right-2 text-red-600 text-xl"
                              onClick={() => {
                                setvarients(
                                  produce((draft) => {
                                    draft[i].selected.splice(setIndex, 1);
                                  })
                                );
                              }}
                            />

                            {attrGroup?.attributes?.map((attr, attrIndex) => (

                              <div key={attrIndex}>
                                <p className="text-gray-800 font-semibold mb-1">{attr?.label}</p>
                                <input
                                  type="text"
                                  placeholder="Value"
                                  className="w-full bg-white text-black border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px]  px-4 py-2 mb-2"
                                  value={attr?.value}
                                  onChange={(e) => {
                                    setvarients(
                                      produce((draft) => {
                                        draft[i].selected[setIndex].attributes[attrIndex].value = e.target.value;
                                      })
                                    );
                                  }}
                                  disabled={attr?.value?.toLowerCase() === "color"}
                                />
                              </div>
                            ))}
                          </div>



                          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mt-4">
                            <div>
                              <p className="text-gray-800 font-semibold mb-1">Qty</p>
                              <input
                                type="number"
                                placeholder="Qty"
                                required
                                className="w-full bg-white text-black border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] px-4 py-2"
                                value={attrGroup?.qty || ""}
                                onChange={(e) => {
                                  setvarients(
                                    produce((draft) => {
                                      draft[i].selected[setIndex].qty = e.target.value;
                                    })
                                  );
                                }}
                              />
                            </div>

                            <div>
                              <p className="text-gray-800 font-semibold mb-1">Price</p>
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-full bg-white text-black border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] px-4 py-2"
                                value={attrGroup?.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? "" : Number(e.target.value); // convert to number
                                  setvarients(
                                    produce((draft) => {
                                      draft[i].selected[setIndex].price = value;
                                    })
                                  );
                                }}
                              />

                            </div>

                            <div>
                              <p className="text-gray-800 font-semibold mb-1">Offer Price</p>
                              <input
                                type="number"
                                placeholder="Offer Price"
                                required
                                className="w-full bg-white text-black border-[2px] border-[#B0B0B0] shadow-[2px_4px_6px_0px_#00000040]  outline-none rounded-[8px] font-normal md:text-[16px] text-[14px] px-4 py-2"
                                value={attrGroup?.offerprice || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? "" : Number(e.target.value);
                                  setvarients(
                                    produce((draft) => {
                                      draft[i].selected[setIndex].offerprice = value;
                                    })
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}


                      {selectedCategory && (
                        <div className="bg-custom-orange not-first:rounded-[10px] shadow-[2px_4px_6px_0px_#00000040] mx-auto mt-2 flex justify-center items-center cursor-pointer w-[160px]">
                          <p
                            className=" py-2 px-4 flex justify-center  items-center gap-2 text-black font-normal text-center text-base"
                            onClick={() => {
                              const newAttrGroup = {
                                attributes: productsData?.Attribute?.map(attr => ({
                                  label: attr.name,
                                  value: attr.name.toLowerCase() === "color" ? selectedColor || "" : "",
                                })),
                                qty: "",
                                price: "",
                                offerprice: "",
                              };

                              setvarients(
                                produce((draft) => {
                                  draft[i].selected.push(newAttrGroup);
                                })
                              );
                            }}

                          >
                            Add More <CirclePlus />
                          </p>
                        </div>
                      )}




                      <div className="w-full mt-5">
                        <div className="relative w-full">
                          <div className="w-full">
                            <p className="text-gray-800 text-lg font-semibold pb-1">
                              Images
                            </p>
                            <div className="border-[2px] border-[#B0B0B0] rounded-[8px] shadow-[2px_4px_6px_0px_#00000040]   p-2.5 w-full bg-custom-light flex justify-start items-center">
                              <input
                                className="bg-white text-black  outline-none  font-normal md:text-[16px] text-[14px] md:w-[90%] w-[85%]"
                                type="text"
                                placeholder="Carousel Images"
                                value={singleImgs[i] || ""}
                                onChange={(e) => {
                                  const updated = [...singleImgs];
                                  updated[i] = e.target.value;
                                  setSingleImgs(updated);
                                }}
                              />
                            </div>
                          </div>

                          <div className="absolute top-[36px] md:right-[10px]  right-[10px]">
                            <MdOutlineFileUpload
                              className="text-black h-8 w-8"
                              onClick={() => {
                                fileRefs.current[i]?.click();
                              }}
                            />
                            <input
                              type="file"
                              ref={(el) => (fileRefs.current[i] = el)}
                              className="hidden"
                              onChange={(e) => handleImageChange(e, i)}
                            />
                          </div>
                        </div>

                        <div className="flex md:flex-row flex-col justify-between items-center mt-5">
                          <p className="text-gray-700 text-[12px] md:text-[14px]"> Please Upload image in 1471 * 981 size for better UI experience </p>
                          <p
                            className="text-black bg-custom-orange shadow-[2px_4px_6px_0px_#00000040] rounded-[10px] text-center text-md py-2 w-24 cursor-pointer"
                            onClick={() => {
                              if (!singleImgs[i]) {
                                toast.error("Carousel Images is required")
                                return;
                              }

                              setvarients(
                                produce((draft) => {
                                  draft[i].image.push(singleImgs[i]);
                                })
                              );

                              const updated = [...singleImgs];
                              updated[i] = "";
                              setSingleImgs(updated);
                            }}
                          >
                            Add
                          </p>
                        </div>
                        <div className="flex md:flex-row flex-wrap md:gap-5 gap-4 mt-5">
                          {item?.image?.map((ig, inx) => (
                            <div className="relative" key={inx}>
                              <img
                                className="md:w-20 w-[85px] h-20 object-contain"
                                src={ig}
                              />
                              <IoCloseCircleOutline
                                className="text-red-700 cursor-pointer h-5 w-5 absolute left-[5px] top-[10px]"
                                onClick={() => {
                                  closeIcon(ig, inx, item?.image, i);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              }

              <div className="w-full md:mt-5 mt-5 flex justify-end mb-5 gap-2">
                <p
                  className="bg-custom-orange flex justify-center items-center gap-2 cursor-pointer md:h-[45px] h-[40px] md:w-[217px] w-full rounded-[12px] NunitoSans text-black shadow-[2px_4px_6px_0px_#00000040] font-normal text-base"
                  onClick={() => {
                    const newVariant = {
                      color: "",
                      image: [],
                      selected: [
                        {
                          attributes: productsData?.Attribute?.map(attr => ({
                            label: attr.name,
                            value: "",
                          })),
                          qty: "",
                          price: "",
                          offerprice: ""
                        }
                      ]
                    };
                    setvarients(prev => [...prev, newVariant]);
                    setSingleImgs(prev => [...prev, ""]);
                  }}
                >
                  Add More Varients <CirclePlus />
                </p>
              </div>


            </div>

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
