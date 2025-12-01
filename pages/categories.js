import { Api, ApiFormData } from "@/services/service";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FiEdit, FiChevronDown, FiChevronRight, FiUpload, FiX } from "react-icons/fi";
import { IoCloseCircleOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import isAuth from "@/components/isAuth";
import { Edit, Pencil, Trash } from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";

function Categories(props) {
  const router = useRouter();
  const categoryRef = useRef();
  const subCategoryRef = useRef();
  const [data, setData] = useState({ name: "", image: null, preview: "", currentImage: "" });
  const [categories, setCategories] = useState([]);
  const [subData, setSubData] = useState({ 
    name: "", 
    categoryId: "", 
    Attribute: [],
    image: null,
    preview: "",
    currentImage: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [hideCategory, setHideCategory] = useState(true);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [addAttribute, setAddAttribute] = useState([]);
  const [attribute, setAttribute] = useState("");
  const [notAvailableSubCategory, setNotAvailableSubCategory] = useState(false)

  const scrollToCategory = () => {
    categoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSubCategory = () => {
    subCategoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleInput = (e) => {
    setAttribute(e.target.value);
  };

  const inputAttribute = (e) => {
    e.preventDefault();
    if (attribute.trim() === "") return;
    setAddAttribute((prev) => [...prev, { name: attribute, id: Date.now() }]);
    setAttribute("");

  };


  const deleteAttribute = (id) => {
    setAddAttribute((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    getAllCategories();
  }, []);

  const getAllCategories = async () => {
    props.loader(true);
    try {
      const res = await Api("get", "category/getCategories", "", router);
      setCategories(res.data);
    } catch (err) {
      toast.error(err.message)
    } finally {
      props.loader(false);
    }
  };

  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({
          ...data,
          image: file,
          preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubcategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubData({
          ...subData,
          image: file,
          preview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCategoryImage = () => {
    setData({
      ...data,
      image: null,
      preview: "",
      currentImage: ""
    });
  };

  const removeSubcategoryImage = () => {
    setSubData({
      ...subData,
      image: null,
      preview: "",
      currentImage: ""
    });
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (!data.name) {
      toast.error("Please fill in the category name");
      return;
    }

    if (notAvailableSubCategory && addAttribute.length === 0) {
      return toast.error("Please add at least one attribute");
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("notAvailableSubCategory", notAvailableSubCategory);
    
    // Only append currentImage if it exists and is not an empty string
    if (data.currentImage) {
      formData.append("currentImage", data.currentImage);
    }
    
    if (data.image) {
      formData.append("image", data.image);
    }
    
    if (notAvailableSubCategory) {
      formData.append("Attribute", JSON.stringify(addAttribute));
    }

    const method = data._id ? "post" : "post";
    const url = data._id ? `category/updateCategory` : `category/createCategory`;

    try {
      const response = await ApiFormData(method, url, formData, router);
      setData({ name: "", image: null, preview: "", currentImage: "" });
      setAddAttribute([]);
      toast.success(data._id ? "Category updated successfully" : "Category added successfully");
      setNotAvailableSubCategory(false);
      getAllCategories();
    } catch (err) {
      console.error("Error in submitCategory:", err);
      toast.error(err?.message || "Something went wrong");
    }
  };

  const submitSubcategory = async (e) => {
    e.preventDefault();
    if (!subData.name || !subData.categoryId) {
      toast.error("Please fill in all fields");
      return;
    }

    if (addAttribute.length === 0) {
      return toast.error("Please add at least one attribute");
    }

    const formData = new FormData();
    formData.append("name", subData.name);
    formData.append("categoryId", subData.categoryId);
    formData.append("Attribute", JSON.stringify(addAttribute));
    
    // Only append currentImage if it exists and is not an empty string
    if (subData.currentImage) {
      formData.append("currentImage", subData.currentImage);
    }
    
    if (subData._id) {
      formData.append("_id", subData._id);
    }
    
    if (subData.image) {
      formData.append("image", subData.image);
    }

    const method = subData._id ? "post" : "post";
    const url = subData._id ? `category/updateSubcategory` : `category/addSubcategory`;

    try {
      await ApiFormData(method, url, formData, router);
      setSubData({ name: "", categoryId: "", image: null, preview: "", currentImage: "" });
      setShowSubcategoryForm(false);
      setHideCategory(true);
      setAddAttribute([]);
      toast.success(subData._id ? "Subcategory updated successfully" : "Subcategory added successfully");
      getAllCategories();
    } catch (err) {
      console.error("Error in submitSubcategory:", err);
      toast.error(err?.message || "Something went wrong");
    }
  };

  const deleteCategory = async (_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to proceed with the deletion?",
      showCancelButton: true,
      confirmButtonColor: "#FF700099",
      confirmButtonText: "#ffffff",
      confirmButtonText: "Delete",
    });
    const data = {
      id: _id,
    };
    if (result.isConfirmed) {
      try {
        await Api("delete", `category/deleteCategory`, data, router);
        toast.success("Category Deleted")
        getAllCategories();
      } catch (err) {
        toast.error(err?.message)
      }
    }
  };

  const deleteSubcategory = async (categoryId, subId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to proceed with the deletion?",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    const data = {
      categoryId: categoryId,
      subId: subId,
    };
    if (result.isConfirmed) {
      try {
        await Api("delete", `category/deleteSubcategory`, data, router);
        getAllCategories();
      } catch (err) {
        toast.error(err?.message)
      }
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleEditSubcategory = (subcategory, categoryId, Attribute) => {
    setSubData({
      ...subcategory,
      categoryId: categoryId,
      Attribute: Attribute,
      currentImage: subcategory.image?.url || "",
      preview: subcategory.image?.url || ""
    });
    setAddAttribute(Attribute || []);
    setShowSubcategoryForm(true);
    setHideCategory(false);
    scrollToSubCategory();
  };

  const handleCancelSubcategory = () => {
    setHideCategory(true);
    setSubData({ name: "", categoryId: "", image: null, preview: "", currentImage: "" });
    setShowSubcategoryForm(false);
    setAddAttribute([]);
  };
  
  const handleCancelCategory = () => {
    setData({ name: "", image: null, preview: "", currentImage: "" });
    setAddAttribute([]);
    setNotAvailableSubCategory(false);
  };

  const AvailableSubCategoryCategory = categories.filter(
    (item) => item.notAvailableSubCategory === false
  );

  const handleEditCategory = (category) => {
    setData({
      _id: category._id,
      name: category.name,
      notAvailableSubCategory: category.notAvailableSubCategory || false,
      currentImage: category.image?.url || "",
      preview: category.image?.url || ""
    });
    if (category.Attribute && category.Attribute.length > 0) {
      setAddAttribute(category.Attribute);
    }
    setNotAvailableSubCategory(category.notAvailableSubCategory || false);
    scrollToCategory();
  };

  return (
    <section className="bg-gray-100 w-full h-full md:pt-5 pt-5 pl-5 pr-5 overflow-y-scroll   scrollbar-hide overflow-scroll pb-28">
      <p className="font-bold text-black md:text-[32px] text-2xl">
        Categories
      </p>

      {hideCategory && (
        <div className="bg-white border md:my-10 my-5 border-gray-200 rounded-[10px] p-5 flex flex-col justify-center items-center"
          ref={categoryRef}
        >
          <p className="text-black mt-4 mb-3 font-semibold ">
            {" "}
            Add Categories
          </p>
          <form
            className=" flex flex-col justify-center items-center bg-white "
            onSubmit={submitCategory}
          >
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category Name
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter category name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category Image
              </label>
              <div className="flex items-center gap-4">
                {(data.preview || data.currentImage) && (
                  <div className="relative">
                    <Image
                      src={data.preview || data.currentImage}
                      alt="Category Preview"
                      width={80}
                      height={80}
                      className="rounded-md object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeCategoryImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 flex items-center justify-center"
                      style={{ width: '20px', height: '20px' }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer bg-custom-orange text-black text-sm font-medium py-2 px-4 rounded-full inline-flex items-center border border-black">
                    <FiUpload className="mr-2" size={16} />
                    <span>{data.preview || data.currentImage ? 'Change Image' : 'Upload Image'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCategoryImageChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Recommended size: 400x400px</p>
                </div>
              </div>
            </div>

            <div className="flex my-2 justify-start items-center gap-4">
              <input
                type="checkbox"
                value="notAvailableCategory"
                checked={notAvailableSubCategory}
                onChange={(e) => {
                  setNotAvailableSubCategory(e.target.checked); // gives true or false
                }}
                className="w-3 h-3"
              />
              <label className="text-gray-700 text-[12px]">
                Subcategories Not Available
              </label>
            </div>

            {notAvailableSubCategory && (
              <div className="mt-0">
                <p className="text-black text-[14px] pb-1 ">
                  {"Attribute"}
                </p>
                <div className="flex gap-3 ">
                  <input
                    className="rounded-[30px] text-black bg-gray-100 border border-custom-offWhite text-[12px] border-custom-offWhite px-4 outline-none py-[8px] md:w-[320px] w-[270px] "
                    type="text"
                    value={attribute}
                    placeholder="Enter Attribute"
                    onChange={handleInput}
                  />
                  <button
                    className="bg-custom-orange px-5 rounded-[30px] text-[14px]  text-black"
                    onClick={inputAttribute}
                  >
                    {"Add"}
                  </button>
                </div>

                <div className="mt-5">
                  <ul>
                    {addAttribute?.map((item, id) => (
                      <div className="flex border w-full justify-between rounded-md bg-custom-lightGrayInputBg my-4 py-1 items-center px-2">
                        <li key={id} className="text-black font-bold">
                          {item?.name}
                        </li>
                        <div className="flex text-2xl gap-2 pt-1">
                          <IoCloseCircleOutline
                            className="text-gray-600 text-3xl cursor-pointer"
                            onClick={() => deleteAttribute(item.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div className="space-x-2">
                <button
                  type="submit"
                  className="bg-custom-orange text-gray-900  py-1.5 px-8  mb-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {data._id ? 'Update Category' : 'Add Category'}
                </button>
                {(data._id || data.name || data.preview || data.currentImage) && (
                  <button
                    type="button"
                    onClick={handleCancelCategory}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
          {!showSubcategoryForm && (
            <div className="mb-5 mt-2">
              <button
                className="py-[6px]  w-[300px] border border-black rounded-[5px] text-[12px] text-black cursor-pointer font-normal"
                onClick={() => {
                  setHideCategory(false);
                  setShowSubcategoryForm(!showSubcategoryForm);
                }}
              >
                {showSubcategoryForm ? "Cancel" : "Add Subcategory"}
              </button>
            </div>
          )}
        </div>
      )}

      {showSubcategoryForm && (
        <form
          className="bg-white border flex flex-col justify-center items-center border-gray-200 rounded-[10px] p-5 mb-5  md:my-10 my-5"
          ref={subCategoryRef}
          onSubmit={submitSubcategory}
        >
          <p className="text-black mt-4 mb-3 font-semibold ">
            {" "}
            Add Sub Categories
          </p>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subcategory Name
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter subcategory name"
              value={subData.name}
              onChange={(e) =>
                setSubData({ ...subData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subcategory Image
            </label>
            <div className="flex items-center space-x-4">
              {(subData.preview || subData.currentImage) && (
                <div className="relative">
                  <Image
                    src={subData.preview || subData.currentImage}
                    alt="Subcategory Preview"
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeSubcategoryImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center">
                <FiUpload className="mr-2" />
                <span>{subData.preview || subData.currentImage ? 'Change Image' : 'Upload Image'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleSubcategoryImageChange}
                />
              </label>
            </div>
          </div>

          <select
            className="bg-gray-100 border outline-none py-[10px] md:w-[400px] w-full rounded-[30px] px-5 text-[12px] font-normal text-black mb-3"
            value={subData.categoryId}
            onChange={(e) =>
              setSubData({ ...subData, categoryId: e.target.value })
            }
            required
          >
            <option value="">Select Category</option>
            {AvailableSubCategoryCategory.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="mt-0">
            <p className="text-gray-500 font-semibold text-[12px] pb-1 ">
              {"Attribute"}
            </p>
            <div className="flex gap-3 ">
              <input
                className="rounded-[30px]  text-black bg-gray-100 border border-custom-offWhite text-[12px] border-custom-offWhite px-4 outline-none py-[8px] md:w-[289px] w-[52vw]"
                type="text"
                value={attribute}
                placeholder="Enter Attribute"
                onChange={handleInput}
              />
              <button
                className="bg-custom-orange px-8 text-[12px] text-black rounded-[30px] "
                onClick={inputAttribute}
              >
                {"Add"}
              </button>
            </div>

            <div className="mt-5">
              <ul>
                {addAttribute?.map((item, id) => (
                  <div className="flex border w-full justify-between rounded-md bg-custom-lightGrayInputBg my-4 py-1 items-center px-2">
                    <li key={id} className="text-black font-bold">
                      {item?.name}
                    </li>
                    <div className="flex text-2xl gap-2 pt-1">
                      <IoCloseCircleOutline
                        className="text-gray-600 text-3xl cursor-pointer"
                        onClick={() => deleteAttribute(item.id)}
                      />
                    </div>
                  </div>
                ))}
              </ul>
            </div>
          </div>

          <button
            className="py-[6px] md:w-[324px] w-[97%] bg-custom-orange rounded-[10px] text-[12px] text-black cursor-pointer "
            type="submit"
          >
            {subData._id ? "Update Subcategory" : "Add Subcategory"}
          </button>
          <button
            type="button"
            className="py-[6px] md:w-[324px] w-[97%] bg-custom-orange rounded-[10px] text-[12px] text-black cursor-pointer  mt-3"
            onClick={handleCancelSubcategory}
          >
            Cancel
          </button>
        </form>
      )}


      <div className="bg-white border border-custom-lightsGrayColor rounded-[10px] p-5 mb-5">
        <input
          className=" text-black border border-gray-300 outline-none h-[40px] md:w-[435px] w-full px-5 rounded-[30px] text-custom-darkBlack  text-[16px]"
          type="text"
          placeholder="Search Categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>


      {categories
        .filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((item) => (
          <div
            key={item._id}
            className="bg-white border border-gray-100 rounded-[10px] p-5 mt-5"
          >
            <div className="flex md:flex-row gap-2 flex-col justify-start items-start md:justify-between md:items-center w-full">
              <div className="flex justify-start items-center gap-3">
                {item.image?.url && (
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200">
                    <Image
                      src={item.image.url}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-base text-black font-semibold">
                  {item.name}
                </p>
              </div>
              <div className="flex justify-center items-center md:gap-6 gap-2">
                {item.Subcategory && item.Subcategory.length > 0 && (
                  <div
                    className="mr-3 cursor-pointer"
                    onClick={() => toggleCategoryExpansion(item._id)}
                  >
                    {expandedCategories[item._id] ? (
                      <div className="flex items-center underline text-[#0099FF]">
                        <p className="text-[14px]">hide Subcategory</p>
                        <FiChevronDown size={18} />
                      </div>
                    ) : (
                      <div className="flex items-center underline text-[#0099FF] ">

                        <p className=" text-[14px]">View SubCategory</p>
                        <FiChevronRight size={15} />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-1 items-center cursor-pointer"
                  onClick={() => {
                    setHideCategory(true);
                    setData(item);
                    setShowSubcategoryForm(false)
                    setAddAttribute(item.Attribute || []);
                    setNotAvailableSubCategory(item.notAvailableSubCategory)
                    scrollToCategory()
                  }}
                ><span className="text-black text-[14px]">Edit Categories</span> <Pencil size={15} className=" text-black  "

                  /></div>
                <div className="flex gap-1 items-center text-[#E84F4F]">
                  <span className=" text-[14px]">Delete Categories</span>
                  <Trash
                    size={15}
                    className=" cursor-pointer"
                    onClick={() => deleteCategory(item._id)}
                  />
                </div>

              </div>
            </div>

            {/* Subcategories */}
            {expandedCategories[item._id] &&
              item.Subcategory &&
              item.Subcategory.length > 0 && (
                <div className="mt-3 ">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Subcategories:
                  </h4>
                  {item.Subcategory.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex md:flex-row gap-2 flex-col justify-start items-start md:justify-between md:items-center bg-gray-100 border border-gray-200 rounded-[5px] p-3 mt-2"
                    >
                      <div className="flex items-center gap-3">
                        {sub.image?.url && (
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-200">
                            <Image
                              src={sub.image.url}
                              alt={sub.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <p className="text-black font-medium">{sub.name}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex gap-1 items-center cursor-pointer"
                          onClick={() => {
                            setAddAttribute(sub.Attribute)
                            scrollToSubCategory()
                            handleEditSubcategory(sub, item._id, sub.Attribute)
                          }}
                        ><span className="text-black text-[14px]">Edit Categories</span> <Pencil size={15} className=" text-black  "
                          /></div>

                        <div className="flex gap-1 items-center text-[#E84F4F]">
                          <span className=" text-[14px]">Delete Categories</span>
                          <Trash
                            size={15}
                            className=" cursor-pointer"
                            onClick={() => deleteSubcategory(item._id, sub._id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}
    </section>
  );
}

export default isAuth(Categories);
