import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import { MdDashboard } from "react-icons/md";
import { ImCross } from "react-icons/im";
import { userContext } from "@/pages/_app";
import { BiSolidCategory } from "react-icons/bi";
import { AiFillProduct } from "react-icons/ai";
import { FaCircleQuestion } from "react-icons/fa6";
import { FaShoppingBag } from "react-icons/fa";
import { PiSignOutFill } from "react-icons/pi";
import Swal from "sweetalert2";
import { MdRateReview } from "react-icons/md";
import { MdContentPasteOff } from "react-icons/md";
import { BiSolidOffer } from "react-icons/bi";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import Image from "next/image";

const SidePannel = ({ setOpenTab, openTab }) => {
  const [user, setUser] = useContext(userContext);
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(null); // desktop submenu state
  const [mobileOpenMenu, setMobileOpenMenu] = useState(null); // mobile submenu state

  const logOut = () => {
    setUser({});
    localStorage.removeItem("userDetail");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    {
      href: "/",
      title: "Dashboard",
      img: <MdDashboard className="text-3xl" />,
      access: ["Admin", "Seller"],
    },
    {
      // href: "/sellers",
      title: "Sellers",
      img: <AiFillProduct className="text-3xl" />,
      access: ["Admin"],
      children: [
        { href: "/sellers", title: "Sellers List" },
        { href: "/sellers/seller-orders", title: "Seller Orders" },
      ],
    },
    {
      href: "/inventory",
      title: "Inventory",
      img: <AiFillProduct className="text-3xl" />,
      access: ["Seller"],
    },
    {
      href: "/queries",
      title: "Queries",
      img: <FaCircleQuestion className="text-3xl" />,
      access: ["Admin"],
    },
    {
      href: "/orders",
      title: "Orders",
      img: <FaShoppingBag className="text-3xl" />,
      access: ["Seller"],
    },
    {
      href: "/categories",
      title: "Categories",
      img: <BiSolidCategory className="text-3xl" />,
      access: ["Admin"],
    },
    {
      href: "/review",
      title: "Reviews",
      img: <MdRateReview className="text-3xl" />,
      access: ["Admin"],
    },
    {
      href: "/ContentManagement",
      title: "Our Content ",
      img: <MdContentPasteOff className="text-3xl" />,
      access: ["Admin"],
    },
    {
      href: "/settings",
      title: "Settings",
      img: <BiSolidCategory className="text-3xl" />,
      access: ["Admin"],
    },
    {
      href: "/SaleProduct",
      title: "Sale",
      img: <BiSolidOffer className="text-3xl" />,
      access: ["Seller"],
    },
    {
      href: "/sellerWallet",
      title: "Wallet",
      img: <BiSolidOffer className="text-3xl" />,
      access: ["Seller"],
    },
    {
      href: "/adminWallet",
      title: "Wallet",
      img: <BiSolidOffer className="text-3xl" />,
      access: ["Admin"],
    },
  ];

  const imageOnError = (event) => {
    // event.currentTarget.src = "/userprofile.png";
  };

  return (
    <>
      {/* ----------------- Desktop Sidebar ----------------- */}
      <div className="xl:w-[280px] fixed top-0 left-0 z-20 md:w-[250px] sm:w-[200px] hidden sm:grid grid-rows-5 overflow-hidden">
        <div>
          <div className="bg-white py-5 overflow-y-scroll h-screen scrollbar-hide">
            <div
              className="bg-white pt-5 pb-5 row-span-1 flex items-center justify-center cursor-pointer mx-5 rounded"
              onClick={() => router.push("/")}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                onError={imageOnError}
              />
            </div>

            <div className="flex flex-col justify-between row-span-4 w-full">
              <ul className="w-full flex flex-col text-left mt-5">
                {menuItems.map((item, i) =>
                  item?.access?.includes(user?.role) ? (
                    <li key={i} className="w-full">
                      <div
                        className={`flex items-center justify-between mx-5 px-6 cursor-pointer group hover:bg-[#FF700099] hover:text-black m-1 ${
                          router.pathname === item.href
                            ? "bg-custom-orange text-black rounded-[8px]"
                            : "text-black"
                        }`}
                        onClick={() =>
                          item.children
                            ? setOpenMenu(openMenu === i ? null : i)
                            : router.push(item.href)
                        }
                      >
                        <div className="py-3 font-semibold flex items-center gap-4">
                          {item?.title}
                        </div>
                        {item.children &&
                          (openMenu === i ? (
                            <IoIosArrowDown className="text-xl" />
                          ) : (
                            <IoIosArrowForward className="text-xl" />
                          ))}
                      </div>

                      {item.children && openMenu === i && (
                        <ul className="mx-4  rounded-lg">
                          {item.children.map((child, j) => (
                            <Link
                              href={child.href}
                              key={j}
                              className={`block py-3 px-10 m-1 font-semibold text-sm hover:bg-[#FF700099] rounded ${
                                router.pathname === child.href
                                  ? "bg-custom-orange text-black font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </ul>
                      )}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- Mobile Sidebar ----------------- */}
      <div
        className={`w-full absolute top-0 left-0 z-40 sm:hidden flex flex-col h-screen max-h-screen overflow-hidden bg-white ${
          openTab ? "scale-x-100" : "scale-x-0"
        } transition-all duration-300 origin-left`}
      >
        <div className="row-span-1 w-full text-black relative">
          <ImCross
            className="absolute text-black top-4 right-4 z-40 text-2xl"
            onClick={() => setOpenTab(!openTab)}
          />
          <div className="flex flex-col gap-3 w-full p-3">
            <div className="p-1 rounded overflow-hidden">
              <p className="text-3xl text-black font-bold"> LOGO</p>
            </div>
            <div className="flex ms-2 justify-between">
              <div className="flex">
                <div className="w-12 h-12 rounded-full overflow-hidden border-white border">
                  <img
                    src="/office-man.png"
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={imageOnError}
                  />
                </div>
                <p className="mt-3 ms-3 text-lg text-black font-bold">
                  {user?.name}
                </p>
              </div>
              <div>
                {user?.token ? (
                  <div
                    className="flex gap-2 mt-3 items-center cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        text: "Are you sure you want to logout?",
                        showCancelButton: true,
                        confirmButtonText: "Yes",
                        cancelButtonText: "No",
                        confirmButtonColor: "#FEC200",
                        customClass: {
                          confirmButton: "px-12 rounded-xl",
                          title: "text-[20px] text-black",
                          actions: "swal2-actions-no-hover",
                          popup: "rounded-[15px] shadow-custom-green",
                        },
                        buttonsStyling: true,
                        reverseButtons: true,
                        width: "320px",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          logOut();
                        }
                      });
                    }}
                  >
                    <div className="text-black font-bold">Sign Out</div>
                    <div className="rounded-full">
                      <PiSignOutFill className="text-3xl text-black" />
                    </div>
                  </div>
                ) : (
                  <Link href="/login">
                    <div className="p-3 mt-3 items-center font-bold text-black">
                      LogIn
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-start row-span-2 h-full w-full">
          <ul className="w-full h-full flex flex-col text-left justify-start items-center border-t-2 border-black">
            {menuItems.map((item, i) =>
              item?.access?.includes(user?.role) ? (
                <li
                  key={i}
                  className="w-full text-black border-b-2 border-black"
                >
                  <div
                    className="flex justify-between items-center w-full px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      item.children
                        ? setMobileOpenMenu(mobileOpenMenu === i ? null : i)
                        : (setOpenTab(false), router.push(item.href))
                    }
                  >
                    <div className="flex items-center gap-4 font-semibold">
                      {item?.img}
                      {item?.title}
                    </div>
                    {item.children &&
                      (mobileOpenMenu === i ? (
                        <IoIosArrowDown className="text-xl" />
                      ) : (
                        <IoIosArrowForward className="text-xl" />
                      ))}
                  </div>

                  {item.children && mobileOpenMenu === i && (
                    <ul className="bg-[#f9f9f9]">
                      {item.children.map((child, j) => (
                        <Link
                          href={child.href}
                          key={j}
                          className={`block py-2 pl-14 text-sm hover:bg-[#FF700099] ${
                            router.pathname === child.href
                              ? "bg-custom-orange text-black"
                              : "text-gray-700"
                          }`}
                          onClick={() => setOpenTab(false)}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </ul>
                  )}
                </li>
              ) : null
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SidePannel;
