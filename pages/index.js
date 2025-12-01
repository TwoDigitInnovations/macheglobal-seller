import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from "next/router";
import { Api } from '@/services/service';
import { toast } from 'react-toastify';
import { FastForward, Plus, Boxes, BanknoteArrowDown, Pencil, ChartLine, ArchiveRestore, Warehouse, HandCoins } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import {

  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Tooltip as RechartsTooltip
} from "recharts";

import isAuth from '@/components/isAuth';
import { userContext } from './_app';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

function Home(props) {
  const router = useRouter();
  const [user, setUser] = useContext(userContext);
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    productsInStock: 0,
    earnings: 0,
    refundRequests: 0,
    payoutsCompleted: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      props.loader(true);
      const res = await Api("get", "product/dashboard-stats", "", router);
      if (res?.status) {
        setDashboardStats({
          totalSales: res.data.totalSales || 0,
          pendingOrders: res.data.pendingOrders || 0,
          productsInStock: res.data.productsInStock || 0,
          earnings: res.data.earnings || 0,
          refundRequests: res.data.refundRequests || 0,
          payoutsCompleted: res.data.payoutsCompleted || 0
        });
      } else {
        console.error("Failed to fetch dashboard stats:", res?.data?.message);
        toast.error(res?.data?.message || "Failed to load dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error(error?.data?.message || error?.message || "An error occurred");
    } finally {
      props.loader(false);
    }
  };

  useEffect(() => {
    const getMonthlySales = async () => {
      props.loader(true);
      Api("get", `getMonthlySales?year=${selectedYear}`, "", router).then(
        (res) => {
          console.log("res================>", res);
          props.loader(false);
          if (res?.status) {
            setSalesData(res?.data);
          } else {
            toast.error(res?.data?.message)
          }
        },
        (err) => {
          props.loader(false);
          console.log(err);
          toast.error(err?.data?.message || err?.message)
        }
      );
    };
    getMonthlySales();
  }, [selectedYear]);

  const COLORS = ['#FE4F01', '#127300', '#1a1a1a', '#FFC107'];

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6 h-full overflow-y-scroll scrollbar-hide overflow-scroll md:pb-24 pb-24 ">
      <div className="max-w-7xl mx-auto space-y-4">
        <p className='md:text-[32px] text-2xl text-black font-bold'> Dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModernStatsCard
            title="Total Sales"
            value={`HTG ${dashboardStats.totalSales.toLocaleString()}`}
            icon={<ChartLine size={45} />}
            accentColor="#44DD22E3"
            message="+12% from last month"
          />
          <ModernStatsCard
            title="Pending Orders"
            value={dashboardStats.pendingOrders}
            icon={<ArchiveRestore size={45} />}
            accentColor="#44DD22E3"
            message={`${Math.min(5, dashboardStats.pendingOrders)} need shipping today`}
          />
          <ModernStatsCard
            title="Products in Stock"
            value={dashboardStats.productsInStock.toLocaleString()}
            icon={<Warehouse size={45} />}
            accentColor="#E84F4F"
            message={`${Math.min(5, Math.floor(dashboardStats.productsInStock * 0.1))} low-stock alerts`}
          />
          <ModernStatsCard
            title="Earnings"
            value={`HTG ${dashboardStats.earnings.toLocaleString()}`}
            icon={<BanknoteArrowDown size={45} />}
            accentColor="#44DD22E3"
            message={`Next payout: ${new Date(new Date().setDate(new Date().getDate() + 5)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          />
          <ModernStatsCard
            title="Refund Requests"
            value={dashboardStats.refundRequests}
            icon={<HandCoins size={45} />}
            accentColor="#E84F4F"
            message={`${Math.min(2, dashboardStats.refundRequests)} pending review`}
          />
          <ModernStatsCard
            title="Payouts Completed"
            value={`HTG ${dashboardStats.payoutsCompleted.toLocaleString()}`}
            icon={<BanknoteArrowDown size={45} />}
            accentColor="#0099FFCC"
            message={`Last payout: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          />

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 mt-1">Sales Trend (Last 7 Days)</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FE4F01] focus:border-transparent"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="flex  bg-custom-orange rounded-lg">
                    <button className=" text-black px-4 py-2 text-sm font-medium">
                      Monthly
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FE4F01" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FE4F01" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151'
                    }}
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="monthly"
                    stroke="#FE4F01"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 w-full max-w-sm">

            <div className="flex items-center gap-2 mb-5">
              <FastForward className="text-black" />
              <p className="text-lg font-semibold text-black">Quick Actions</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-100 text-black font-medium shadow-sm hover:bg-orange-200 transition">
                <Plus className="w-5 h-5" />
                Add New Product
              </button>

              <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-300 text-black font-medium shadow-sm hover:bg-gray-100 transition">
                <Boxes className="w-5 h-5" />
                View Orders
              </button>

              <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-300 text-black font-medium shadow-sm hover:bg-gray-100 transition">
                <BanknoteArrowDown className="w-5 h-5" />
                Withdraw Earnings
              </button>

              <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-300 text-black font-medium shadow-sm hover:bg-gray-100 transition">
                <Pencil className="w-5 h-5" />
                Edit Store Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default isAuth(Home);


const ModernStatsCard = ({ title, value, icon, gradient, accentColor, color, message }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl px-4 py-5 shadow-xl border border-white/50 overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">

      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-600 text-[16px] font-semibold tracking-wide uppercase">{title}</p>
            <p className="text-[36px] text-black mt-2  flex-wrap">{value}</p>
            <p style={{ color: accentColor }} className="text-[14px] mt-2 flex-wrap">
              {message}
            </p>

          </div>
          <div
            className="p-1 rounded-[6px] text-black shadow-lg transform group-hover:scale-110 transition-transform duration-300 bg-[#FF700099]"

          >
            {icon}
          </div>

        </div>


      </div>
    </div>
  );
};