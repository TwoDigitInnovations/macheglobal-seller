"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { Api } from "../../services/service";
import isAuth from "../../components/isAuth";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  CircularProgress,
  CardMedia,
  Rating,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Avatar,
  Container
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  Tag as TagIcon,
  Inventory as StockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocalOffer as OfferIcon
} from "@mui/icons-material";

const ProductDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await Api('get', `product/getProductById/${id}`, null);
      console.log("Product details response:", response);
      setProduct(response.data || response);
      setError(null);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError(err.message || "Failed to load product details. Please try again later.");
      toast.error(err.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'out of stock':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getProductImage = () => {
    if (product?.varients?.length > 0 && product.varients[0]?.image?.length > 0) {
      return product.varients[0].image[0];
    }
    
    if (product?.image) {
      if (typeof product.image === 'string') return product.image;
      if (product.image?.url) return product.image.url;
      if (Array.isArray(product.image) && product.image[0]) {
        return typeof product.image[0] === 'string' ? product.image[0] : product.image[0]?.url;
      }
    }
    
    return '/empty-box.png';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6">No product found</Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa', 
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      py: 3 
    }}>
      <Container 
        maxWidth="2xl" 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
          pr: 1,
          pb: 2
        }}
      >
        {/* Header */}
        <Box 
          mb={3} 
          display="flex" 
          alignItems="center" 
          flexWrap="wrap" 
          gap={2}
          sx={{ 
            bgcolor: 'white', 
            p: 2.5, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
          
          </Typography>
          <Chip
            label={product.status || 'Active'}
            color={getStatusColor(product.status)}
            sx={{ 
              textTransform: 'capitalize',
              fontWeight: 600,
              px: 1
            }}
          />
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Image & Seller */}
          <Grid item xs={12} lg={4}>
            {/* Product Image */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid #e0e0e0'
              }}
            >
              <CardMedia
                component="img"
                image={getProductImage()}
                alt={product.name}
                sx={{ 
                  width: '100%',
                  height: 400,
                  objectFit: 'contain', 
                  bgcolor: '#fafafa',
                  borderRadius: 2
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/empty-box.png';
                }}
              />
            </Paper>

            {/* Seller Information */}
            {product.SellerId && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Seller Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box display="flex" alignItems="center" mb={2.5}>
                  <Avatar 
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      mr: 2, 
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 600
                    }}
                  >
                    {product.SellerId.name?.charAt(0).toUpperCase() || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {product.SellerId.name || 'N/A'}
                    </Typography>
                    <Chip 
                      label={product.SellerId.role || 'Seller'} 
                      size="small" 
                      color="primary" 
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Box>
                
                <List dense disablePadding>
                  {product.SellerId.email && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <EmailIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="caption" color="text.secondary">Email</Typography>}
                        secondary={<Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{product.SellerId.email}</Typography>}
                      />
                    </ListItem>
                  )}
                  {product.SellerId.phone && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PhoneIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="caption" color="text.secondary">Phone</Typography>}
                        secondary={<Typography variant="body2">{product.SellerId.phone}</Typography>}
                      />
                    </ListItem>
                  )}
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CalendarIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="caption" color="text.secondary">Joined</Typography>}
                      secondary={
                        <Typography variant="body2">
                          {product.SellerId.createdAt 
                            ? new Date(product.SellerId.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) 
                            : 'N/A'}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Grid>

          {/* Right Column - Product Info */}
          <Grid item xs={12} lg={8}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                mb: 3, 
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                {product.name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Rating value={product.rating || 0} precision={0.5} readOnly size="medium" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5, fontWeight: 500 }}>
                  ({product.numReviews || 0} reviews)
                </Typography>
              </Box>

              <Box 
                mb={3} 
                sx={{ 
                  bgcolor: '#f0f7ff', 
                  p: 2.5, 
                  borderRadius: 2,
                  border: '1px solid #bbdefb'
                }}
              >
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                  ${(product.varients?.[0]?.selected?.[0]?.price || product.price || 0).toFixed(2)}
                  {product.varients?.[0]?.selected?.[0]?.offerprice < product.varients?.[0]?.selected?.[0]?.price && (
                    <Typography component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary', ml: 1, fontSize: '0.8em' }}>
                      ${(product.varients?.[0]?.selected?.[0]?.price || 0).toFixed(2)}
                    </Typography>
                  )}
                </Typography>
                {product.pieces !== undefined && (
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip 
                      icon={<StockIcon />}
                      label={`${product.pieces} pieces available`} 
                      color={product.pieces > 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    {product.sold_pieces > 0 && (
                      <Chip 
                        icon={<OfferIcon />}
                        label={`${product.sold_pieces} sold`} 
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {product.short_description && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600} color="text.primary">
                    Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {product.short_description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Product Details Grid */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Product Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, height: '100%' }}>
                    <List dense disablePadding>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CategoryIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>Category</Typography>}
                          secondary={<Typography variant="body2" fontWeight={600}>{product.categoryName || product.category?.name || 'N/A'}</Typography>}
                        />
                      </ListItem>
                      {product.subCategoryName && (
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CategoryIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>Subcategory</Typography>}
                            secondary={<Typography variant="body2" fontWeight={600}>{product.subCategoryName}</Typography>}
                          />
                        </ListItem>
                      )}
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <StoreIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>Brand</Typography>}
                          secondary={<Typography variant="body2" fontWeight={600}>{product.brandName || product.Brand?.name || 'N/A'}</Typography>}
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2, height: '100%' }}>
                    <List dense disablePadding>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <TagIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>SKU</Typography>}
                          secondary={<Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{product.slug || product._id?.slice(-8) || 'N/A'}</Typography>}
                        />
                      </ListItem>
                      {product.gender && (
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <PersonIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>Gender</Typography>}
                            secondary={<Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{product.gender}</Typography>}
                          />
                        </ListItem>
                      )}
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <StockIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="caption" color="text.secondary" fontWeight={500}>Stock Status</Typography>}
                          secondary={
                            <Chip 
                              label={product.pieces > 0 ? 'In Stock' : 'Out of Stock'} 
                              color={product.pieces > 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ mt: 0.5, fontWeight: 600 }}
                            />
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Grid>
              </Grid>

              {/* Attributes */}
              {product.Attribute && product.Attribute.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Attributes
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {product.Attribute.map((attr, index) => (
                      <Chip 
                        key={index} 
                        label={typeof attr === 'object' ? JSON.stringify(attr) : attr}
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Variants */}
              {product.varients && product.varients.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Available Variants
                  </Typography>
                  <Grid container spacing={2}>
                    {product.varients.map((variant, index) => (
                      <Grid item key={index} xs={6} sm={4} md={3}>
                        <Paper 
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': {
                              borderColor: 'primary.main',
                              cursor: 'pointer'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          {variant.image && variant.image[0] && (
                            <Box 
                              component="img"
                              src={variant.image[0]}
                              alt={`Variant ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'contain',
                                mb: 1.5,
                                borderRadius: 1
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/empty-box.png';
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              {variant.color || `Variant ${index + 1}`}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="body1" fontWeight={700} color="primary">
                                ${variant.selected?.[0]?.offerprice?.toFixed(2) || variant.selected?.[0]?.price?.toFixed(2) || '0.00'}
                              </Typography>
                              {variant.selected?.[0]?.offerprice < variant.selected?.[0]?.price && (
                                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                  ${variant.selected?.[0]?.price?.toFixed(2)}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Qty: {variant.selected?.[0]?.qty || 0}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: '#fafafa',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }
                }}
                variant="fullWidth"
              >
                <Tab label="Description" />
                <Tab label="Specifications" />
                <Tab label="Price Slots" />
              </Tabs>

              <Box sx={{ p: 4 }}>
            {tabValue === 0 && (
  <Box>
    <Typography variant="h6" gutterBottom fontWeight={600}>
      Product Description
    </Typography>
    <Typography 
      variant="body1" 
      color="text.secondary" 
      paragraph 
      sx={{ lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ 
        __html: product.long_description || product.short_description || 'No detailed description available for this product.' 
      }}
    />
    
    {product.parameter_type && (
      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight={600}>
          Parameter Type
        </Typography>
        <Chip 
          label={product.parameter_type} 
          color="info" 
          sx={{ fontWeight: 600 }}
        />
      </Box>
    )}
  </Box>
)}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Technical Specifications
                    </Typography>
                    <List sx={{ bgcolor: '#fafafa', borderRadius: 2 }}>
                      <ListItem divider sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Product ID</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all', mt: 0.5 }}>{product._id}</Typography>}
                        />
                      </ListItem>
                      <ListItem divider sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Slug</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{product.slug || 'N/A'}</Typography>}
                        />
                      </ListItem>
                      <ListItem divider sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Total Pieces</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{product.pieces || 0}</Typography>}
                        />
                      </ListItem>
                      <ListItem divider sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Sold Pieces</Typography>}
                          secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{product.sold_pieces || 0}</Typography>}
                        />
                      </ListItem>
                      <ListItem divider sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Created At</Typography>}
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {product.createdAt ? new Date(product.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={600}>Last Updated</Typography>}
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Price Slots
                    </Typography>
                    {product.price_slot && product.price_slot.length > 0 ? (
                      <Grid container spacing={2}>
                        {product.price_slot.map((slot, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                borderRadius: 2,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: 3
                                }
                              }}
                            >
                              <CardContent>
                                <Typography variant="body2" fontWeight={500}>
                                  {typeof slot === 'object' ? JSON.stringify(slot, null, 2) : slot}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box 
                        sx={{ 
                          bgcolor: '#fafafa', 
                          p: 4, 
                          borderRadius: 2, 
                          textAlign: 'center' 
                        }}
                      >
                        <Typography color="text.secondary">
                          No price slots available for this product.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default isAuth(ProductDetails);