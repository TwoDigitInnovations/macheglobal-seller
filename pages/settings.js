import React, { useState, useRef, useEffect } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import { useRouter } from "next/router";
import { IoCloseCircleOutline } from "react-icons/io5";
import { Api, ApiFormData } from "@/services/service";
import isAuth from "@/components/isAuth";
import Compressor from "compressorjs";
import { toast } from "react-toastify";

function Settings(props) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const bannerFileRef = useRef(null);
  const [carouselImg, setCarouselImg] = useState([]);
  const [singleImg, setSingleImg] = useState("");
  const selectRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [SelectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    getsetting();
    getAllCategories();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb > 1) {
      toast.error("Too large file. Please upload a under 1 Mb image")
      return;
    } else {
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
                setSingleImg(res.data.fileUrl);
                toast.success(res?.message || "image Uploaded sucessfully")
              }
            },
            (err) => {
              props.loader(false);
              console.log(err);
              props.toaster({ type: "error", message: err?.message });
            }
          );
        },
      });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Check if there are any images to submit
    if (carouselImg.length === 0) {
      toast.error("Please add at least one image to the carousel");
      return;
    }

    props.loader(true);

    try {
      // Prepare the data with existing carousel items
      const formattedCarousel = carouselImg.map(item => ({
        image: item.image,
        Category: item.Category || null
      }));

      const data = {
        carousel: formattedCarousel,
      };

      console.log("Submitting data:", data); // Debug log

      const res = await Api(
        "post",
        "user/createOrUpdateImage",
        data,
        router
      );

      props.loader(false);
      if (res?.success) {
        setSubmitted(false);
        toast.success(res?.message || "Banner Uploaded successfully");
        // Refresh the carousel data
        getsetting();
      } else {
        toast.error(res?.data?.message || "Banner Upload failed");
      }
    } catch (err) {
      props.loader(false);
      console.error("Error:", err);
      toast.error(err?.response?.data?.message || "Banner Upload failed");
    }
  };

  const getsetting = async () => {
    props.loader(true);
    Api("get", "user/getsetting", "", router).then(
      (res) => {
        props.loader(false);

        if (res?.success) {
          if (res?.setting.length > 0) {
            setCarouselImg(res?.setting[0].carousel || []);
          }
        } else {
          props.loader(false);
          console.log(res?.data?.message);
          props.toaster({ type: "error", message: res?.data?.message });
        }
      },
      (err) => {
        props.loader(false);
        console.log(err);
        props.toaster({ type: "error", message: err?.message });
      }
    );
  };

  const getAllCategories = async () => {
    props.loader(true);
    try {
      const res = await Api("get", "category/getCategories", "", router);
      setCategories(res.data);
    } catch (err) {
      props.toaster({ type: "error", message: err?.message });
    } finally {
      props.loader(false);
    }
  };

  const closeBannerIcon = (item) => {
    const filteredImages = carouselImg.filter((f) => f.image !== item.image);
    setCarouselImg(filteredImages);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <>
      <section className="w-full bg-gray-50  p-4 h-[90vh] overflow-y-scroll scrollbar-hide overflow-scroll pb-32">
        <div className="mb-8">
          <div className="">
            <p className="text-gray-800 font-bold md:text-[32px] text-xl mb-4 ms-4">Settings</p>
            <h2 className="text-gray-800 font-normal md:text-[24px] text-xl mb-4 shadow-xl bg-white py-3 rounded-[10px] px-4">
              Banner Management
            </h2>

            <section className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <form className="w-full" onSubmit={submit}>
                <div className="space-y-4">

                  <div className="relative w-full">
                    <label className="text-gray-700 text-lg font-medium mb-2 block">
                      Banner Images
                    </label>
                    <div className="border border-gray-300 hover:border-[#F38529] transition-colors rounded-lg p-1 px-4 w-full bg-white flex justify-start items-center">
                      <input
                        className="outline-none bg-transparent w-full text-gray-700"
                        type="text"
                        placeholder="Enter image URL"
                        value={singleImg}
                        onChange={(text) => {
                          setSingleImg(text.target.value);
                        }}
                      />
                      <div
                        className="ml-2 cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors"
                        onClick={() => {
                          bannerFileRef.current.click();
                        }}
                      >
                        <MdOutlineFileUpload className="text-gray-700 h-6 w-6" />
                      </div>
                      <input
                        type="file"
                        ref={bannerFileRef}
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                    {submitted && carouselImg.length === 0 && (
                      <p className="text-red-600 mt-1 text-sm">
                        Banner image is required
                      </p>
                    )}

                    <div className="mt-4 border border-gray-300 hover:border-[#F38529] transition-colors rounded-lg p-3 w-full md:w-[300px] bg-white flex justify-start items-center">
                      <select
                        className="outline-none bg-transparent w-full text-gray-700"
                        value={SelectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value)
                        }
                        }
                      >
                        <option value="">-- Select Category --</option>
                        {categories?.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {submitted && SelectedCategory === "" && (
                      <p className="text-red-600 mt-1 text-sm">
                        Category is required
                      </p>
                    )}

                  </div>

                  <div className="flex flex-col justify-between items-start gap-2">
                    <p className="text-gray-800 text-[12px] md:text-[12px]">
                      Please upload the banner in 1281x756 resolution. This
                      ensures it looks great on both mobile and website views.
                    </p>
                    <button
                      type="button"
                      className="text-black border-black border transition-colors rounded-lg text-sm py-2 px-3 font-medium shadow-sm cursor-pointer"
                      onClick={() => {
                        if (singleImg === "") {
                          props.toaster({
                            type: "error",
                            message: "Banner Images is required",
                          });
                          return;
                        }
                        // Create a new carousel item with proper null handling for Category
                        const newCarouselItem = {
                          image: singleImg,
                          Category: SelectedCategory || null
                        };
                        setCarouselImg([...carouselImg, newCarouselItem]);
                        setSingleImg("");
                        setSelectedCategory("");
                      }}
                    >
                      Add Image
                    </button>
                  </div>


                  <div className="flex flex-wrap gap-4 mt-4">
                    {carouselImg?.map((item, i) => (
                      <div key={i} className="relative group">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <img
                            className="max-w-full max-h-full object-contain"
                            src={item.image}
                            alt="Banner preview"
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-90 hover:opacity-100 transition-opacity"
                          onClick={() => {
                            closeBannerIcon(item);
                          }}
                        >
                          <IoCloseCircleOutline className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="">
                    <button
                      type="submit"
                      className="text-black cursor-pointer bg-custom-orange transition-colors rounded-lg text-md font-medium py-1.5 px-4 shadow-sm"
                    >
                      Submit Banner
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

export default isAuth(Settings);