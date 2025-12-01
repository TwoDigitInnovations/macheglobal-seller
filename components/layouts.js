/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import { useRouter } from "next/router";
import { useState } from "react";
import SidePannel from "./SidePannel";
import Navbar from "./Navbar";

const Layout = ({ children, loader, toaster }) => {
  const router = useRouter();
  const [openTab, setOpenTab] = useState(false)

  return (
    <div className="h-screen max-w-screen bg-white">

      <div className="md:h-[10vh] h-[8vh] w-full"
      >
        <div className="max-w-screen flex  relative ">
          {
            !(router.pathname.includes('/login')) &&
            <SidePannel setOpenTab={setOpenTab} openTab={openTab} />
          }
          <div className={
            !(router.pathname.includes('/login')) ? "w-full xl:pl-[280px] md:pl-[250px] sm:pl-[200px]" : "w-full"}>
            <main className={"w-full h-screen relative overflow-hidden"}>
              {
                !(router.pathname.includes('/login')) &&
                <Navbar setOpenTab={setOpenTab} openTab={openTab} />
              }
              {children}
            </main>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Layout;
