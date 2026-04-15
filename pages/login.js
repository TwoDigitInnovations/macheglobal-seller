import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from "lucide-react";
import { userContext } from "./_app";
import { Api } from "@/services/service";
import { toast } from "react-toastify";

export default function Login(props) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [userDetail, setUserDetail] = useState({
    email: "",
    password: "",
  });
  const [user, setUser] = useContext(userContext);

  const submit = async () => {
    setSubmitted(true);

    if (!userDetail.email || !userDetail.password) {
      toast.error("Missing credentials");
      return;
    }

    try {
      setLoading(true);
      props.loader(true);

      const res = await Api("post", "auth/login", { ...userDetail }, router);
      
      // Check if OTP is required
      if (res?.requireOTP) {
        // Block Admin from logging into seller panel
        if (res?.role === "Admin") {
          toast.error("Admin accounts cannot login to the seller panel. Please use the admin panel.");
          props.loader(false);
          setLoading(false);
          return;
        }
        
        // Allow Seller OTP verification
        if (res?.role === "Seller") {
          setVerificationToken(res.verificationToken);
          setShowOTPScreen(true);
          toast.success("OTP sent to your email");
          props.loader(false);
          setLoading(false);
          return;
        }
      }

      if (res?.status) {
        const userData = res.data?.user || res.user;
        const token = res.data?.token || res.token;
        
        // Check if user is a Seller
        if (userData?.role === "Seller") {
          // Check if seller account is pending
          if (userData?.status === "pending") {
            toast.error("Your account is under review. Please wait for admin approval.");
            props.loader(false);
            setLoading(false);
            return;
          }
          
          localStorage.setItem("userDetail", JSON.stringify(userData));
          localStorage.setItem("token", token);
          setUser(userData);
          setUserDetail({ email: "", password: "" });
          toast.success(res.data?.message || res.message || "Login successful!");
          router.push("/");
        } else {
          // Show specific message for non-sellers
          toast.error("You are not a seller. Please login with a seller account.");
        }
      } else {
        // Show backend error message
        const errorMessage = res?.message || res?.data?.message || "Your account is under review. Please wait for admin approval..";
        toast.error(errorMessage);
        console.error("Login failed:", res.message || res.data?.message || "Unknown error");
      }
      props.loader(false);
      setLoading(false);
    } catch (err) {
      props.loader(false);
      setLoading(false);
      console.error(err);
      
      // Show backend error message if available
      const errorMessage = err?.response?.data?.message || err?.message || "Something went Wrong";
      toast.error(errorMessage);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      props.loader(true);

      const res = await Api("post", "auth/verifySellerOTP", {
        otp,
        verificationToken
      }, router);

      if (res?.status) {
        const userData = res.data.user;
        
        // Check if seller account is pending
        if (userData?.status === "pending") {
          toast.error("Your account is under review. Please wait for admin approval.");
          props.loader(false);
          setLoading(false);
          return;
        }
        
        localStorage.setItem("userDetail", JSON.stringify(userData));
        localStorage.setItem("token", res.data?.token);
        setUser(userData);
        setUserDetail({ email: "", password: "" });
        setOtp("");
        toast.success("Login successful!");
        router.push("/");
      } else {
        toast.error(res?.message || "OTP verification failed");
      }
      
      props.loader(false);
      setLoading(false);
    } catch (err) {
      props.loader(false);
      setLoading(false);
      console.error(err);
      toast.error(err?.message || "OTP verification failed");
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const goBackToLogin = () => {
    setShowOTPScreen(false);
    setOtp("");
    setVerificationToken("");
  };

  return (
    <div className="min-h-screen bg-custom-orange flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10 bg-opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white backdrop-blur-sm shadow-2xl rounded-3xl md:p-8 p-5 transform hover:scale-[1.02] transition-all duration-300">
          {/* Logo Section */}
          <div className="text-center md:mb-8 mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="MacheGlobal Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="md:text-2xl text-xl font-bold text-gray-800 mb-2">
              {showOTPScreen ? "Verify OTP" : "Welcome Back!"}
            </h1>
            <p className="text-gray-600 md:text-sm text-[12px]">
              {showOTPScreen 
                ? "Enter the 6-digit code sent to your email" 
                : "Sign in to access your dashboard"}
            </p>
          </div>

          {/* Form */}
          {!showOTPScreen ? (
            <div className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-3 md:text-[16px] text-[14px] border text-neutral-700 rounded-xl focus:ring-2 focus:ring-4EB0CF focus:border-transparent outline-none transition-all duration-200 ${
                      submitted && !userDetail.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:bg-white"
                    }`}
                    value={userDetail.email}
                    onChange={(e) => setUserDetail({ ...userDetail, email: e.target.value })}
                  />
                </div>
                {submitted && !userDetail.email && (
                  <p className="text-red-500 text-xs font-medium flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    Email is required
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>

                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`w-full pl-10 text-neutral-700 md:text-[16px] text-[14px] pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-4EB0CF focus:border-transparent outline-none transition-all duration-200 ${
                      submitted && !userDetail.password
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:bg-white"
                    }`}
                    value={userDetail.password}
                    onChange={(e) => setUserDetail({ ...userDetail, password: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        submit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? (
                      <EyeOff className="h-5 w-5 text-gray-500 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 transition-colors" />
                    )}
                  </button>
                </div>
                {submitted && !userDetail.password && (
                  <p className="text-red-500 text-xs font-medium flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    Password is required
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full bg-custom-orange text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-4EB0CF/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </button>
            </div>
          ) : (
            // OTP Screen
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Enter OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 md:text-[16px] text-[14px] border text-neutral-700 rounded-xl focus:ring-2 focus:ring-4EB0CF focus:border-transparent outline-none transition-all duration-200 border-gray-300 focus:bg-white tracking-widest text-center font-semibold"
                    value={otp}
                    onChange={handleOTPChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 6) {
                        verifyOTP();
                      }
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-custom-orange text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-4EB0CF/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Verify OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={goBackToLogin}
                disabled={loading}
                className="w-full text-gray-600 font-medium py-2 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">© 2025 MacheGlobal(Marketplace) All rights reserved.</p>
          </div>
        </div>

        <div className="absolute -top-14 -left-10 w-32 h-32 rounded-full bg-amber-500 blur-md opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div
          className="absolute -bottom-8 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-md opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
}