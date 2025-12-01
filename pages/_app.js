import Layout from "@/components/layouts";
import Loader from "@/components/loader";
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

export const userContext = createContext();
export const dataContext = createContext();

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState({});
  const [data, setData] = useState({});
  const [open, setOpen] = useState(false); // loader state
  const [toast, setToast] = useState({
    type: "",
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    setToast(toast);
    if (!!toast.message) {
      setTimeout(() => {
        setToast({ type: "", message: "" });
      }, 5000);
    }
  }, [toast]);

  useEffect(() => {
    getUserDetail();
  }, []);

  const getUserDetail = () => {
    const user = localStorage.getItem("userDetail");
    if (user) {
      setUser(JSON.parse(user));
    } else {
      if (router.route !== "/login") {
        router.push("/login");
      }
    }
  };

  return (
    <>
      <dataContext.Provider value={[data, setData]}>
        <userContext.Provider value={[user, setUser]}>
          <Loader open={open} />
          <ToastContainer position="top-right" autoClose={3000} />

          <Layout loader={setOpen} toaster={setToast}>
            <Loader open={open} />
            {user && (
              <Component
                {...pageProps}
                loader={setOpen}
                toaster={setToast}
                user={user}
              />
            )}
          </Layout>
        </userContext.Provider>
      </dataContext.Provider>
    </>
  );
}
