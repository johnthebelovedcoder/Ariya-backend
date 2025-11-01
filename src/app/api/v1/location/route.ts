import { NextRequest } from 'next/server';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { validateInput } from '@/lib/validation';

// GET /api/location/countries - Get all supported countries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    
    if (country) {
      // Get states for a specific country
      const states = await getStatesForCountry(country);
      return createApiResponse({ states }, 'States retrieved successfully');
    } else {
      // Get all countries
      const countries = await getAllCountries();
      return createApiResponse({ countries }, 'Countries retrieved successfully');
    }
  } catch (error: any) {
    return handleApiError(error, 'GET /api/location');
  }
}

// POST /api/location/cities - Get cities for a specific country and state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationRules = {
      country: { required: true, type: 'string', maxLength: 100 },
      state: { required: true, type: 'string', maxLength: 100 }
    };
    
    const validation = validateInput(body, validationRules);
    if (!validation.isValid) {
      return createApiError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
    
    const cities = await getCitiesForCountryAndState(body.country, body.state);
    
    return createApiResponse({ cities }, 'Cities retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/location/cities');
  }
}

// Mock data for demonstration - in a real app, this would come from a database or external API
async function getAllCountries(): Promise<Array<{ code: string; name: string; }>> {
  return [
    { code: 'NG', name: 'Nigeria' },
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    // Add more countries as needed
  ];
}

async function getStatesForCountry(countryCode: string): Promise<string[]> {
  const statesMap: Record<string, string[]> = {
    NG: ['Lagos', 'Abuja', 'Rivers', 'Kano', 'Anambra'],
    US: ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
    UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
    AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
  };
  
  return statesMap[countryCode] || [];
}

async function getCitiesForCountryAndState(countryCode: string, state: string): Promise<string[]> {
  const citiesMap: Record<string, Record<string, string[]>> = {
    NG: {
      'Lagos': ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Agege'],
      'Abuja': ['Garki', 'Wuse', 'Asokoro', 'Maitama', 'Jabi'],
      'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Eleme', 'Tai']
    },
    US: {
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth']
    },
    UK: {
      'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds']
    }
  };
  
  return citiesMap[countryCode]?.[state] || [];
}