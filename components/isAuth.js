import { useEffect } from "react";
import { useRouter } from "next/router";

const isAuth = (Component) => {
  return function IsAuth(props) {
    const router = useRouter();
    let auth = false;

    if (typeof window !== "undefined") {
      const user = localStorage.getItem("userDetail");
      const token = localStorage.getItem("token");

      if (user) {
        const u = JSON.parse(user);
        const token = localStorage.getItem("token");
        if (
          router?.pathname === "/" ||
          router?.pathname === "/inventory" ||
          router?.pathname === "/add-product" ||
          router?.pathname === "/orders" ||
          router.pathname ==="/products/[id]" ||
          router?.pathname === "/Notification" ||
          router?.pathname === "/SaleProduct" ||
          router?.pathname === "/wallet"  ||
          router?.pathname === "/AddSale"
        ) {
          auth =
            token && (u?.role === "Admin" || u?.role === "Seller")
              ? true
              : false;
        } else {
          auth = token && u?.role === "Admin" ? true : false;
        }
      }
    }

    useEffect(() => {
      if (!auth) {
        localStorage.clear();
        router.replace("/login");
      }
    }, []);

    return <Component {...props} />;
  };
};

export default isAuth;
