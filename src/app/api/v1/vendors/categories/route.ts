import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/vendors/categories - Get all vendor categories
export async function GET(request: NextRequest) {
  try {
    // This endpoint can be public - anyone can view vendor categories
    
    // In a real implementation, this would fetch distinct categories from the database
    // For now, return a predefined list of vendor categories
    const categories = [
      'Catering',
      'Photography',
      'Videography',
      'Decoration',
      'Entertainment',
      'Venue',
      'Florists',
      'Makeup Artists',
      'Hair Stylists',
      'Wedding Planners',
      'Event Coordinators',
      'Lighting',
      'Sound Systems',
      'Cake Bakers',
      'Transportation',
      'Invitations',
      'Gift Registry',
      'Party Rentals',
      'Officiants',
      'Security'
    ];
    
    // In a real implementation, we might also include:
    // - Number of vendors in each category
    // - Average ratings for categories
    // - Popular categories in different regions
    
    const categoryData = categories.map(category => ({
      name: category,
      slug: category.toLowerCase().replace(/\s+/g, '-'),
      vendorCount: Math.floor(Math.random() * 50) + 10, // Random count for demo
      averageRating: (Math.random() * 2 + 3).toFixed(1) // Random rating between 3-5
    }));
    
    return createApiResponse({
      categories: categoryData,
      total: categoryData.length
    }, 'Vendor categories retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/categories');
  }
}