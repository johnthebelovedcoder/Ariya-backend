import { EventIdeaRequest } from './types';

export class EventIdeaService {
  // Generate event ideas based on user input
  static async generateEventIdeas(request: EventIdeaRequest) {
    // This would typically connect to an AI service like OpenAI
    // For now, we'll return some example ideas based on provided parameters
    
    const ideas = [
      {
        id: 'idea-1',
        title: 'Garden Party',
        description: 'A beautiful outdoor event with flowers, light refreshments, and nature themes',
        tags: ['outdoor', 'relaxed', 'nature'],
        estimatedBudget: request.budget ? request.budget * 0.8 : 200000,
        guestCapacity: request.guestCount ? request.guestCount : 50,
        difficulty: 'medium',
        season: 'spring/summer'
      },
      {
        id: 'idea-2',
        title: 'Vintage Elegance',
        description: 'A classy event with vintage decorations, formal wear, and classic entertainment',
        tags: ['formal', 'elegant', 'classic'],
        estimatedBudget: request.budget ? request.budget * 1.2 : 400000,
        guestCapacity: request.guestCount ? request.guestCount : 75,
        difficulty: 'hard',
        season: 'any'
      },
      {
        id: 'idea-3',
        title: 'Cultural Celebration',
        description: 'A vibrant event celebrating cultural heritage with traditional music, food, and activities',
        tags: ['cultural', 'colorful', 'traditional'],
        estimatedBudget: request.budget ? request.budget * 0.9 : 250000,
        guestCapacity: request.guestCount ? request.guestCount : 100,
        difficulty: 'medium',
        season: 'any'
      }
    ];

    return {
      ideas,
      total: ideas.length,
      filtersApplied: {
        eventType: request.eventType,
        location: request.location,
        guestCount: request.guestCount
      }
    };
  }

  // Get theme suggestions for event type
  static async getEventThemes(eventType: string) {
    // Return theme suggestions based on event type
    const themes: Record<string, { name: string; description: string; colorPalette: string[] }[]> = {
      wedding: [
        { 
          name: 'Classic Romance', 
          description: 'Timeless elegant theme with whites, ivories, and soft pastels',
          colorPalette: ['#FFFFFF', '#F8F6F0', '#E8D8C4', '#9D8189'] 
        },
        { 
          name: 'Bohemian', 
          description: 'Free-spirited theme with earthy tones and natural elements',
          colorPalette: ['#8A6B3F', '#A8905A', '#C9B27D', '#D4C5A9'] 
        },
        { 
          name: 'Modern Minimalist', 
          description: 'Clean lines with monochromatic color schemes',
          colorPalette: ['#000000', '#363636', '#969696', '#DBDBDB'] 
        }
      ],
      birthday: [
        { 
          name: 'Color Splash', 
          description: 'Vibrant theme with multiple bright colors',
          colorPalette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B'] 
        },
        { 
          name: 'Golden Glam', 
          description: 'Luxurious theme with gold accents',
          colorPalette: ['#FFD700', '#D4AF37', '#B8860B', '#F9E79F'] 
        },
        { 
          name: 'Rustic Charm', 
          description: 'Country-style theme with burlap and mason jar decorations',
          colorPalette: ['#8B4513', '#A0522D', '#D2691E', '#DEB887'] 
        }
      ],
      corporate: [
        { 
          name: 'Professional Elegance', 
          description: 'Clean, corporate look with professional aesthetics',
          colorPalette: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'] 
        },
        { 
          name: 'Brand Identity', 
          description: 'Theme matching company brand colors',
          colorPalette: ['#3498DB', '#2980B9', '#E74C3C', '#C0392B'] 
        }
      ]
    };

    const eventTypeThemes = themes[eventType.toLowerCase()] || themes.birthday; // default to birthday themes
    return {
      eventType,
      themes: eventTypeThemes,
      total: eventTypeThemes.length
    };
  }
}