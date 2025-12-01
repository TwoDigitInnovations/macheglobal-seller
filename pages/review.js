import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  X,
  Star,
  StarHalf,
  User,
  Package,
  ListRestart,
} from "lucide-react";
import { Api } from "@/services/service";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

function ReviewPage(props) {
  const [viewPopup, setViewPopup] = useState(false);
  const [popupData, setPopupData] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const router = useRouter();

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  const primaryColor = "#FF700099";

  const fetchReviews = async (page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      const response = await Api(
        "get", 
        `reviews?page=${page}&limit=${limit}${selectedDate ? `&date=${selectedDate}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`, 
        {}, 
        router
      );

      console.log('Fetch reviews response:', response);
      
      if (response && response.data) {
        
        const reviewsData = Array.isArray(response.data) ? response.data : [];
        
        console.log('Setting reviews:', reviewsData);
        setReviews(reviewsData);
        
        setPagination({
          totalPages: response.data.totalPages || 1,
          currentPage: page,
          itemsPerPage: limit,
          totalItems: response.data.totalItems || reviewsData.length
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
      if (props.loader) props.loader(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage, pagination.itemsPerPage);
  }, [currentPage, selectedDate, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
        ))}

        {hasHalfStar && (
          <StarHalf size={16} className="fill-yellow-400 text-yellow-400" />
        )}

        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={16} className="text-gray-300" />
        ))}

        <span className="text-sm text-gray-600 ml-2">({rating})</span>
      </div>
    );
  };

  const handleViewDetails = (review) => {
    setPopupData(review);
    setViewPopup(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviews(1, pagination.itemsPerPage);
  };

  const handleReset = () => {
    setSelectedDate("");
    setSearchQuery("");
    setCurrentPage(1);
    fetchReviews(1, pagination.itemsPerPage);
  };

  const ReviewCard = ({ review }) => {
    // Ensure review data exists before rendering
    if (!review) {
      return null;
    }
    
    // Format the date in the style: "22nd August, 2025"
    const formatFullDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      // Add ordinal suffix (st, nd, rd, th)
      const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
    };
    
    return (
      <div className="w-full h-auto bg-white border border-gray-200 rounded-lg md:p-4 p-3 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
        <div className="flex md:flex-row flex-col justify-between items-start mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Posted by:</p>
              <h3 className="font-medium text-gray-900">{review.posted_by?.name || 'Anonymous'}</h3>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 mb-1">Posted on:</p>
              <p className="font-medium text-gray-900">{formatFullDate(review.createdAt)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Package size={18} className="text-gray-400" />
            <div>
              {/* <p className="text-sm text-gray-500 mb-1">Product name:</p> */}
              <p className="font-medium text-gray-900">
                {review.product?.name || 'Product not available'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          {renderStars(review.rating)}
        </div>

        {review.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-lg font-semibold leading-relaxed">
              {review.description}
            </p>
          </div>
        )}

        {review.images?.length > 0 && (
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review ${index + 1}`}
                className="h-20 w-20 object-cover rounded"
              />
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => handleViewDetails(review)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF700099] rounded-lg "
          
          >
            View Details
          </button>
          <button
            onClick={() => deleteReview(review._id)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#E84F4F99] rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const deleteReview = async (reviewId) => {
    try {
      const result = await Swal.fire({
        title: "Delete Review",
        text: "Are you sure you want to delete this review?",
        showCancelButton: true,
        cancelButtonColor: "#F38529",
        confirmButtonColor: "#F38529",
        confirmText: "Delete",
        width: "350px",
      });

      if (result.isConfirmed) {
        props.loader(true);
        const response = await Api("delete", `reviews/${reviewId}`, {}, router);
        
        if (response?.status) {
          toast.success("Review deleted successfully");
          fetchReviews(currentPage, pagination.itemsPerPage);
        } else {
          throw new Error(response?.data?.message || 'Failed to delete review');
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    } finally {
      props.loader(false);
    }
  };

  return (
    <section className="w-full h-full bg-gray-50 p-6 overflow-y-scroll scrollbar-hide overflow-scroll pb-28">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-gray-900 font-bold md:text-[32px] text-2xl">Reviews</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-[14px] font-medium text-gray-700 mb-1.5 pl-3">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-1 border border-gray-300 rounded-[30px] focus:ring-2 focus:outline-none text-black"
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
                className="flex items-center justify-center px-2 py-1 rounded-lg text-black text-[16px] font-medium transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Search
                <Search size={18} className="ml-2" />
              </button>

              <button
                onClick={handleReset}
                className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-700 cursor-pointer rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Reset
                <ListRestart size={20} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Product Reviews</h2>
          <p className="text-sm text-gray-500">Manage and moderate customer reviews</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-20">
            <div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
              style={{ borderColor: primaryColor }}
            ></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col justify-center items-center p-12 text-center">
            <div className="w-24 h-24 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Package size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-500 max-w-md">
              {searchQuery || selectedDate 
                ? 'No reviews match your search criteria. Try adjusting your filters.'
                : 'There are no reviews to display at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Details Popup */}
      {viewPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-full overflow-y-scroll scrollbar-hide overflow-scroll pb-12">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Review Details
                </h2>
                <button
                  onClick={() => setViewPopup(false)}
                  className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Customer Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Name: {popupData.posted_by.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {popupData.posted_by.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {popupData.posted_by.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    Review Date:{" "}
                    {new Date(popupData.createdAt).toLocaleString()}
                  </p>
                  {popupData.updatedAt !== popupData.createdAt && (
                    <p className="text-sm text-gray-600">
                      Last Updated:{" "}
                      {new Date(popupData.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>


                <div className="bg-gray-50 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Product Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Product Name: {popupData.product?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Brand: {popupData.product?.brandName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Category: {popupData.product?.categoryName}
                  </p>
                  <p className="text-sm text-gray-600">
                    SubCategory: {popupData.product?.subCategoryName}
                  </p>
                  {popupData.product?.variants?.[0]?.selected?.[0] ? (
                    <p className="text-sm text-gray-600">
                      Price: ${popupData.product.variants[0].selected[0].price || 'N/A'}
                      {popupData.product.variants[0].selected[0].offerprice && (
                        <span> (Offer Price: ${popupData.product.variants[0].selected[0].offerprice})</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Price information not available</p>
                  )}
                </div>


                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Rating</h3>
                  {renderStars(popupData.rating)}
                </div>


                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Review</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                    {popupData.description}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setViewPopup(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all cursor-pointer"
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

export default ReviewPage;
