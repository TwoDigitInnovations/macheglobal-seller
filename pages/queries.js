import React, { useMemo, useState, useEffect } from 'react';
import Table from '@/components/table';
import { Api } from '@/services/service';
import { indexID } from '@/components/reported/customTableAct';
import { useRouter } from 'next/router';
import moment from 'moment';
import isAuth from '@/components/isAuth';
import {
  Search,
  Calendar,
  Filter,
  X,
  Eye,
  Phone,
  Mail,
  User,
  XCircle,
  ListRestart,
  EyeClosed
} from 'lucide-react';
import { toast } from 'react-toastify';


function Queries(props) {
  const router = useRouter();
  const [queries, setQueries] = useState([]);
  const [viewPopup, setViewPopup] = useState(false);
  const [popupData, setPopupData] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(popupData.status || 'pending');
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });

  const primaryColor = '#FF700099'; // The specified orange color code

  useEffect(() => {
    fetchQueries(selectedDate, currentPage);
  }, [currentPage, selectedDate]);

  const fetchQueries = async (selectedDate, page = 1, limit = 10) => {
    const data = {};

    if (selectedDate) {
      data.curDate = moment(new Date(selectedDate)).format();
    }

    if (searchParams.name) {
      data.name = searchParams.name;
    }

    if (searchParams.email) {
      data.Email = searchParams.email;
    }

    setIsLoading(true);
    props.loader(true);

    try {
      const res = await Api("post", `user/getContactUs?page=${page}&limit=${limit}`, data, router);

      props.loader(false);
      setIsLoading(false);

      if (res?.status) {
        setQueries(res?.data);
        setPagination(res?.pagination);
        setCurrentPage(res?.pagination?.currentPage);
      } else {
        toast.error(err?.data?.message || err?.data?.message || "Failed to fetch queries")
      }
    } catch (err) {
      props.loader(false);
      setIsLoading(false);
      toast.error(err?.data?.message || err?.message || "An error occurred")
    }
  };

  const handleSearch = () => {
    fetchQueries(selectedDate, 1);
  };

  const handleReset = () => {
    console.log('Reset button clicked');
    // First reset the search params
    const emptyParams = { name: '', email: '' };
    setSearchParams(emptyParams);
    setSelectedDate('');
    
    // Force immediate fetch with empty data
    const fetchWithEmptyParams = async () => {
      setIsLoading(true);
      props.loader(true);
      
      try {
        const res = await Api("post", `user/getContactUs?page=1&limit=10`, {}, router);
        props.loader(false);
        setIsLoading(false);
        
        if (res?.status) {
          setQueries(res?.data);
          setPagination(res?.pagination);
          setCurrentPage(1);
        }
      } catch (err) {
        props.loader(false);
        setIsLoading(false);
        toast.error(err?.data?.message || err?.message || "An error occurred");
      }
    };
    
    fetchWithEmptyParams();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateStatusAPI = (id, status) => {
    props.loader(true);
    const data = {
      id,
      status
    };
    Api("post", "user/updateStatus", data, router)
      .then((res) => {
        props.loader(false);
        if (res?.status === true) {
          toast.success("Status updated successfully")
          fetchQueries(null, currentPage);
        } else {
          toast.error(res?.message || "Failed to update status")
        }
      })
      .catch((err) => {
        props.loader(false);
        toast.error(err?.message || "An error occurred")
      });
  };


  const renderName = ({ value }) => (
    <div className=" flex  justify-center items-center">
      <p className="text-gray-800 text-[16px] font-medium">{value}</p>
    </div>
  );

  const renderEmail = ({ value }) => (
    <div className=" flex justify-center items-center">
      <p className="text-gray-800 text-[16px] ">{value}</p>
    </div>
  );

  const renderDate = ({ value }) => (
    <div className="flex items-center justify-center">
      <p className="text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-[15px] ">
        {moment(value).format('DD MMM YYYY')}
      </p>
    </div>
  );

  const renderStatus = ({ value }) => {
    let colorClass = '';

    switch (value) {
      case 'pending':
        colorClass = 'text-yellow-500';
        break;
      case 'resolved':
        colorClass = 'text-green-600';
        break;
      case 'closed':
        colorClass = 'text-red-600';
        break;
      default:
        colorClass = 'text-gray-600';
    }

    return (
      <div className="flex items-center justify-center">
        <p className={`text-[16px] font-semibold capitalize ${colorClass}`}>
          {value}
        </p>
      </div>
    );
  };


  const renderActions = ({ row }) => (
    <div className="flex items-center justify-center">
      <button
        className="flex gap-2 items-center px-4 py-2 bg-opacity-10 bg-custom-lightgold rounded-lg hover:bg-opacity-20 transition-all"
        style={{ backgroundColor: `${primaryColor}20` }}
        onClick={() => {
          setViewPopup(true);
          setPopupData(row.original);
        }}
      >
        <span className="text-black font-medium cursor-pointer">View </span>
        <Eye size={18} className="" />
      </button>
    </div>
  );

  const columns = useMemo(
    () => [
      {
        Header: "ID",
        Cell: indexID,
        width: 60
      },
      {
        Header: "NAME",
        accessor: 'name',
        Cell: renderName,

      },
      {
        Header: "EMAIL",
        accessor: 'Email',
        Cell: renderEmail
      },
      {
        Header: "DATE",
        accessor: 'createdAt',
        Cell: renderDate,

      },
      {
        Header: "Status",
        accessor: 'status',
        Cell: renderStatus
      },

      {
        Header: "ACTIONS",
        Cell: renderActions,
        width: 120
      },
    ],
    [pagination]
  );

  return (
    <section className="w-full h-full bg-gray-50 p-6 overflow-y-scroll   scrollbar-hide overflow-scroll pb-28">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-gray-900 font-bold md:text-[32px] text-2xl">Queries</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-[14px]  text-gray-700 mb-1">Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={searchParams.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-[12px] rounded-[30px]  focus:outline-none text-black"
                  style={{ focusRing: `${primaryColor}40` }}
                />
                <User
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[14px]  text-gray-700 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={searchParams.email}
                  onChange={handleFilterChange}
                  placeholder="Search by Email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-[12px] rounded-[30px] focus:outline-none text-black"
                  style={{ focusRing: `${primaryColor}40` }}
                />
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <label className="block text-[16px]  font-medium text-gray-700 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-[12px] rounded-[30px] focus:outline-none text-black"
                  style={{ focusRing: `${primaryColor}40` }}
                />
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-3">
              <button
                onClick={handleSearch}
                className="flex items-center justify-center px-5 py-2 rounded-lg text-black text-[14px]  font-medium transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Search
                <Search size={18} className="ml-2" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center text-[14px] px-5 py-2 border border-black  bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                <ListRestart size={18} className="mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: primaryColor }}></div>
          </div>
        ) : queries.length === 0 ? (
          <div className="flex flex-col justify-center items-center p-20 text-center md:min-h-[500px]">
            <img src="/empty-box.png" alt="No data" className="md:w-32 w-20 md:h-32 h-20 mb-4 opacity-60" />
            <h3 className="md:text-xl text-md font-medium text-gray-700 mb-1">No queries found</h3>
            <p className="text-gray-500 md:text-md text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto px-5">
            <Table
              columns={columns}
              data={queries}
              pagination={pagination}
              onPageChange={(page) => setCurrentPage(page)}
              currentPage={currentPage}
              itemsPerPage={pagination.itemsPerPage}
            />
          </div>
        )}
      </div>


      {viewPopup && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] transform transition-all relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setViewPopup(false)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <XCircle size={24} className="text-gray-700" />
              </button>
            </div>

            <div className="p-6 pt-10">
              <div className="w-16 h-1 bg-gray-200 mx-auto mb-6 rounded-full"></div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Query Details</h3>
                <p className="text-gray-500 text-sm">
                  From {popupData.name} • {moment(popupData.createdAt).format('DD MMM YYYY')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <User size={18} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-gray-800 font-medium text-sm">{popupData.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Mail size={18} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800 text-sm">{popupData.Email}</p>
                    </div>
                  </div>


                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Subject:</h4>
                <div
                  className="p-4 border border-gray-200 rounded-lg bg-white"
                  style={{ minHeight: '70px' }}
                >
                  <p className="text-gray-800 whitespace-pre-wrap">{popupData.subject}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2 mt-4">Message:</h4>
                <div
                  className="p-4 border border-gray-200 rounded-lg bg-white"
                  style={{ minHeight: '120px' }}
                >
                  <p className="text-gray-800 whitespace-pre-wrap">{popupData.message}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2 mt-4">Status:</h4>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-2.5 border w-full border-gray-200 rounded-lg bg-white text-gray-800"
                  style={{ minHeight: '40px' }}
                >
                  {['pending', 'resolved', 'closed'].map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>


              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    updateStatusAPI(popupData._id, selectedStatus);
                    setViewPopup(false);
                  }}
                  className="w-full py-1.5 rounded-lg font-medium text-black transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Submit
                </button>

                <button
                  onClick={() => setViewPopup(false)}
                  className="w-full py-1.5 rounded-lg font-medium text-black transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default isAuth(Queries);