import { NextRequest } from 'next/server';
import { OpenAPIV3 } from 'openapi-types';

export const dynamic = 'force-dynamic';

// Define the OpenAPI specification for the Ariya Backend API
const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Ariya Backend API',
    description: 'Complete API for the Ariya event planning platform - Organized into 10 main domains',
    version: '1.0.0',
    contact: {
      name: 'Ariya API Support',
      email: 'support@ariya.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.ariya.com/api/v1',
      description: 'Production server',
    }
  ],
  tags: [
    {
      name: 'Authentication & User Management',
      description: 'User registration, login, profile management, password reset, notifications'
    },
    {
      name: 'Event Management',
      description: 'Event creation, dashboard, guest lists, budget tracking, seating arrangements, tasks/checklists, event-vendor assignments'
    },
    {
      name: 'Vendor & Venue Discovery',
      description: 'Vendor search/filtering, vendor profiles, categories, featured listings, availability calendars, reviews & ratings'
    },
    {
      name: 'Inquiry, Quotes & Bookings',
      description: 'Quote requests, vendor inquiries, booking workflow, confirmations, cancellations'
    },
    {
      name: 'Messaging',
      description: 'In-platform messaging between event planners and vendors, conversations, unread counts'
    },
    {
      name: 'Event Website & Registry',
      description: 'Customizable event websites, public event pages, RSVP forms, gift registries, contributions, thank-you note tracking'
    },
    {
      name: 'AI Planning Assistant',
      description: 'Event idea generation, budget estimation & allocation, vendor recommendations, cost optimization advice, AI feedback loop'
    },
    {
      name: 'Payment & Monetization',
      description: 'Payment processing, transaction fees, vendor subscriptions (Basic/Premium), featured listing purchases, payment history'
    },
    {
      name: 'Admin Management',
      description: 'Admin dashboard, user management, vendor approval workflow, analytics & reporting, system configuration'
    },
    {
      name: 'Utility & System Services',
      description: 'File uploads, location services, search/autocomplete, notification preferences, system utilities'
    }
  ],
  paths: {
    // AUTHENTICATION ROUTES
    '/auth/[...nextauth]': {
      post: {
        summary: 'Authentication endpoint',
        description: 'NextAuth.js default authentication endpoint',
        tags: ['Authentication & User Management'],
      }
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate a user and return tokens',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'securepassword' },
                  rememberMe: { type: 'boolean', example: false }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequest'
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'User registration',
        description: 'Register a new user',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'securepassword' },
                  role: { type: 'string', enum: ['PLANNER', 'VENDOR'], example: 'PLANNER' },
                  businessName: { type: 'string', example: 'Gourmet Catering' },
                  category: { type: 'string', example: 'Catering' },
                  location: { type: 'string', example: 'New York, NY' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registration successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/BadRequest'
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'User logout',
        description: 'Log out the current user',
        tags: ['Authentication & User Management'],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logout successful' },
                    data: { type: 'null' },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Forgot password',
        description: 'Request password reset',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset request successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Password reset email sent' },
                    data: { type: 'null' },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset password',
        description: 'Reset user password with token',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string', example: 'reset-token-123' },
                  newPassword: { type: 'string', format: 'password', example: 'newsecurepassword' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Password reset successful' },
                    data: { type: 'null' },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/refresh-token': {
      post: {
        summary: 'Refresh authentication token',
        description: 'Get new access token using refresh token',
        tags: ['Authentication & User Management'],
        responses: {
          '200': {
            description: 'Token refresh successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token refreshed' },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify email',
        description: 'Verify user email with token',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'verification-token-123' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email verification successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Email verified successfully' },
                    data: { type: 'null' },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // USER MANAGEMENT ROUTES
    '/users': {
      get: {
        summary: 'Get all users',
        description: 'Get all users with optional filtering (Admin role required)',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filter by user role',
            required: false,
            schema: { type: 'string', enum: ['PLANNER', 'VENDOR', 'ADMIN'] },
          },
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Users retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        users: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a new user',
        description: 'Register a new user in the system',
        tags: ['Authentication & User Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', example: 'securepassword' },
                  role: { type: 'string', enum: ['PLANNER', 'VENDOR', 'ADMIN'], default: 'PLANNER' },
                  profileImage: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' },
                  phone: { type: 'string', example: '+1234567890' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User created successfully' },
                    data: { $ref: '#/components/schemas/User' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get a specific user by ID',
        description: 'Get user details by ID. Requires authenticated user (own profile) or Admin',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User retrieved successfully' },
                    data: { $ref: '#/components/schemas/User' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a specific user',
        description: 'Update user details by ID. Requires authenticated user (own profile) or Admin',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', example: 'newpassword' },
                  profileImage: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' },
                  phone: { type: 'string', example: '+1234567890' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User updated successfully' },
                    data: { $ref: '#/components/schemas/User' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a specific user',
        description: 'Delete user by ID. Requires authenticated user (own profile) or Admin',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User deleted successfully' },
                    data: { type: 'null' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/users/{id}/avatar': {
      put: {
        summary: 'Update user avatar',
        description: 'Update user profile image',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['avatarUrl'],
                properties: {
                  avatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Avatar updated successfully' },
                    data: { $ref: '#/components/schemas/User' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/users/{id}/notifications': {
      get: {
        summary: 'Get user notifications',
        description: 'Get notifications for a specific user',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Notifications retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Notifications retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        notifications: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Notification' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/user/preferences': {
      get: {
        summary: 'Get user preferences',
        description: 'Get current user\'s preferences',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User preferences retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Preferences retrieved successfully' },
                    data: { $ref: '#/components/schemas/UserPreferences' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        summary: 'Update user preferences',
        description: 'Update current user\'s preferences',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserPreferences' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User preferences updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Preferences updated successfully' },
                    data: { $ref: '#/components/schemas/UserPreferences' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // EVENTS ROUTES
    '/events': {
      get: {
        summary: 'Get all events',
        description: 'Get all events for the authenticated user',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Events retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        events: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Event' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new event',
        description: 'Create a new event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'date', 'location', 'budget'],
                properties: {
                  name: { type: 'string', example: 'Wedding' },
                  type: { type: 'string', example: 'Wedding' },
                  date: { type: 'string', format: 'date', example: '2025-06-15' },
                  location: { type: 'string', example: 'Central Park, New York' },
                  budget: { type: 'number', format: 'decimal', example: 5000 },
                  guestCount: { type: 'number', example: 100 },
                  theme: { type: 'string', example: 'Vintage' },
                  notes: { type: 'string', example: 'Special dietary requirements' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Event created successfully' },
                    data: { $ref: '#/components/schemas/Event' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/events/{id}': {
      get: {
        summary: 'Get a specific event',
        description: 'Get event details by ID. Requires authenticated user (event owner)',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Event retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Event retrieved successfully' },
                    data: { $ref: '#/components/schemas/Event' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a specific event',
        description: 'Update event details by ID. Requires authenticated user (event owner)',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Wedding' },
                  type: { type: 'string', example: 'Wedding' },
                  date: { type: 'string', format: 'date', example: '2025-06-15' },
                  location: { type: 'string', example: 'Central Park, New York' },
                  budget: { type: 'number', format: 'decimal', example: 5000 },
                  guestCount: { type: 'number', example: 100 },
                  theme: { type: 'string', example: 'Vintage' },
                  notes: { type: 'string', example: 'Special dietary requirements' },
                  status: { type: 'string', example: 'PLANNING' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Event updated successfully' },
                    data: { $ref: '#/components/schemas/Event' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a specific event',
        description: 'Delete event by ID. Requires authenticated user (event owner)',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Event deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Event deleted successfully' },
                    data: { type: 'null' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // EVENT BUDGET ROUTES
    '/events/{id}/budget': {
      get: {
        summary: 'Get event budget',
        description: 'Get budget details for a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Budget retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Budget retrieved successfully' },
                    data: { $ref: '#/components/schemas/EventBudget' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update event budget',
        description: 'Update budget details for a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateEventBudgetRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Budget updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Budget updated successfully' },
                    data: { $ref: '#/components/schemas/EventBudget' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // EVENT GUESTS ROUTES
    '/events/{id}/guests': {
      get: {
        summary: 'Get event guests',
        description: 'Get guests for a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Guests retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Guests retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        guests: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Guest' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        summary: 'Add event guest',
        description: 'Add a guest to a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateGuestRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Guest added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Guest added successfully' },
                    data: { $ref: '#/components/schemas/Guest' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // EVENT TASKS ROUTES
    '/events/{id}/tasks': {
      get: {
        summary: 'Get event tasks',
        description: 'Get tasks for a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Tasks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Tasks retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        tasks: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Task' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        summary: 'Create event task',
        description: 'Create a task for a specific event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateTaskRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task created successfully' },
                    data: { $ref: '#/components/schemas/Task' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // VENDORS ROUTES
    '/vendors': {
      get: {
        summary: 'Get all vendors',
        description: 'Get all vendors with optional filtering',
        tags: ['Vendor & Venue Discovery'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by vendor category',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'location',
            in: 'query',
            description: 'Filter by vendor location',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'minRating',
            in: 'query',
            description: 'Filter by minimum rating',
            required: false,
            schema: { type: 'number', minimum: 0, maximum: 5 },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term for name, description, category, or location',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendors retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendors retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        vendors: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Vendor' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new vendor',
        description: 'Create a new vendor profile. Requires authenticated user (VENDOR role)',
        tags: ['Vendor & Venue Discovery'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessName', 'description', 'category', 'pricing', 'location'],
                properties: {
                  businessName: { type: 'string', example: 'Gourmet Catering' },
                  description: { type: 'string', example: 'Premium catering services' },
                  category: { type: 'string', example: 'Catering' },
                  pricing: { type: 'number', format: 'decimal', example: 100 },
                  location: { type: 'string', example: 'New York, NY' },
                  portfolio: {
                    type: 'array',
                    items: { type: 'string', format: 'uri' },
                    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
                  },
                  availability: {
                    type: 'object',
                    example: {
                      monday: { start: '09:00', end: '18:00' },
                      tuesday: { start: '09:00', end: '18:00' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Vendor created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendor created successfully' },
                    data: { $ref: '#/components/schemas/Vendor' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/vendors/{id}': {
      get: {
        summary: 'Get a specific vendor',
        description: 'Get vendor details by ID',
        tags: ['Vendor & Venue Discovery'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Vendor ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendor retrieved successfully' },
                    data: { $ref: '#/components/schemas/Vendor' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // VENDOR REVIEWS ROUTES
    '/vendors/{id}/reviews': {
      get: {
        summary: 'Get vendor reviews',
        description: 'Get reviews for a specific vendor',
        tags: ['Vendor & Venue Discovery'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Vendor ID',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'minRating',
            in: 'query',
            description: 'Filter by minimum rating',
            required: false,
            schema: { type: 'number', minimum: 1, maximum: 5 },
          },
        ],
        responses: {
          '200': {
            description: 'Reviews retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Reviews retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        reviews: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Review' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Submit vendor review',
        description: 'Submit a review for a specific vendor',
        tags: ['Vendor & Venue Discovery'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Vendor ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateReviewRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Review submitted successfully' },
                    data: { $ref: '#/components/schemas/Review' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // BOOKINGS ROUTES
    '/bookings': {
      get: {
        summary: 'Get bookings',
        description: 'Get bookings for an event or vendor. Requires authenticated user (event owner or vendor)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'eventId',
            in: 'query',
            description: 'Event ID to get bookings for (required if not vendorId)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'vendorId',
            in: 'query',
            description: 'Vendor ID to get bookings for (required if not eventId)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by booking status',
            required: false,
            schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
          },
        ],
        responses: {
          '200': {
            description: 'Bookings retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Bookings retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        bookings: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Booking' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a new booking',
        description: 'Create a new booking. Requires authenticated user (event owner)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventId', 'vendorId', 'amount'],
                properties: {
                  eventId: { type: 'string', example: 'event123' },
                  vendorId: { type: 'string', example: 'vendor456' },
                  amount: { type: 'number', format: 'decimal', example: 500 },
                  notes: { type: 'string', example: 'Special dietary requirements' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Booking created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking created successfully' },
                    data: { $ref: '#/components/schemas/Booking' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/bookings/{id}': {
      get: {
        summary: 'Get a specific booking',
        description: 'Get booking details by ID. Requires authenticated user (event owner or booking vendor)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Booking ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Booking retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking retrieved successfully' },
                    data: { $ref: '#/components/schemas/Booking' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a specific booking',
        description: 'Update booking details by ID. Requires authenticated user (event owner or booking vendor)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Booking ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], example: 'CONFIRMED' },
                  amount: { type: 'number', format: 'decimal', example: 600 },
                  notes: { type: 'string', example: 'Updated dietary requirements' },
                  paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], example: 'PAID' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Booking updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking updated successfully' },
                    data: { $ref: '#/components/schemas/Booking' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a specific booking',
        description: 'Delete booking by ID. Requires authenticated user (event owner)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Booking ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Booking deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking deleted successfully' },
                    data: { type: 'null' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // BOOKING CANCELLATION ROUTE
    '/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel a booking',
        description: 'Cancel a specific booking. Requires authenticated user (event owner)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Booking ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Booking cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking cancelled successfully' },
                    data: { $ref: '#/components/schemas/Booking' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // MESSAGING ROUTES
    '/messages': {
      get: {
        summary: 'Get user messages',
        description: 'Get messages for the authenticated user',
        tags: ['Messaging'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'conversationId',
            in: 'query',
            description: 'Filter by conversation ID',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Messages retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Messages retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        messages: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Message' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Send a message',
        description: 'Send a message to another user',
        tags: ['Messaging'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateMessageRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Message sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Message sent successfully' },
                    data: { $ref: '#/components/schemas/Message' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/messages/{id}/read': {
      post: {
        summary: 'Mark message as read',
        description: 'Mark a specific message as read',
        tags: ['Messaging'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Message ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Message marked as read successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Message marked as read' },
                    data: { $ref: '#/components/schemas/Message' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/messages/conversations': {
      get: {
        summary: 'Get user conversations',
        description: 'Get conversations for the authenticated user',
        tags: ['Messaging'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Conversations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Conversations retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        conversations: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Conversation' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/messages/unread-count': {
      get: {
        summary: 'Get unread message count',
        description: 'Get count of unread messages for the authenticated user',
        tags: ['Messaging'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Unread count retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Unread count retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        count: { type: 'number', example: 5 },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // NOTIFICATION ROUTES
    '/notifications': {
      get: {
        summary: 'Get user notifications',
        description: 'Get notifications for the authenticated user',
        tags: ['Authentication & User Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Notifications retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Notifications retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        notifications: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Notification' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // PAYMENT ROUTES
    '/payments/{id}/refund': {
      post: {
        summary: 'Process payment refund',
        description: 'Process a refund for a specific payment',
        tags: ['Payment & Monetization'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Payment ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', example: 'Product not as described' },
                  amount: { type: 'number', minimum: 0, example: 100.00 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Refund processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Refund processed successfully' },
                    data: { $ref: '#/components/schemas/Payment' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // SEARCH ROUTES
    '/search': {
      get: {
        summary: 'Search across content',
        description: 'Search across events, vendors, users, etc.',
        tags: ['Utility & System Services'],
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by content type',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Search results retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Search results retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        results: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              type: { type: 'string' },
                              id: { type: 'string' },
                              title: { type: 'string' },
                              description: { type: 'string' },
                            },
                          },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // LOCATION ROUTES
    '/locations': {
      get: {
        summary: 'Get locations',
        description: 'Get locations with optional filtering',
        tags: ['Utility & System Services'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Search term for location',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'country',
            in: 'query',
            description: 'Filter by country',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Locations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Locations retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        locations: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Location' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // CURRENCY ROUTES
    '/currency': {
      get: {
        summary: 'Get supported currencies',
        description: 'Get list of supported currencies',
        tags: ['Utility & System Services'],
        responses: {
          '200': {
            description: 'Currencies retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Currencies retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        currencies: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Currency' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/currency-converter': {
      get: {
        summary: 'Currency conversion',
        description: 'Convert amount from one currency to another',
        tags: ['Utility & System Services'],
        parameters: [
          {
            name: 'from',
            in: 'query',
            description: 'Source currency code',
            required: true,
            schema: { type: 'string', example: 'USD' },
          },
          {
            name: 'to',
            in: 'query',
            description: 'Target currency code',
            required: true,
            schema: { type: 'string', example: 'EUR' },
          },
          {
            name: 'amount',
            in: 'query',
            description: 'Amount to convert',
            required: true,
            schema: { type: 'number', example: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Currency conversion successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Currency conversion successful' },
                    data: {
                      type: 'object',
                      properties: {
                        from: { type: 'string', example: 'USD' },
                        to: { type: 'string', example: 'EUR' },
                        amount: { type: 'number', example: 100 },
                        convertedAmount: { type: 'number', example: 92.50 },
                        rate: { type: 'number', example: 0.925 },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // UPLOAD ROUTES
    '/upload': {
      post: {
        summary: 'Upload a file',
        description: 'Upload a file to the server',
        tags: ['Utility & System Services'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  },
                  type: {
                    type: 'string',
                    example: 'avatar'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'File uploaded successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        fileId: { type: 'string', example: 'file-123' },
                        fileName: { type: 'string', example: 'image.jpg' },
                        url: { type: 'string', format: 'uri', example: 'https://example.com/uploads/image.jpg' },
                        size: { type: 'number', example: 102400 },
                        type: { type: 'string', example: 'image/jpeg' }
                      }
                    },
                    errors: { type: 'null' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    
    // VENDOR FEATURED ROUTES
    '/vendors/featured': {
      get: {
        summary: 'Get featured vendors',
        description: 'Get featured vendors (paid or high-rated)',
        tags: ['Vendor & Venue Discovery'],
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter by vendor category',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'location',
            in: 'query',
            description: 'Filter by vendor location',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results (default: 10, max: 50)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Featured vendors retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Featured vendors retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        vendors: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Vendor' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // VENDOR CATEGORIES ROUTES
    '/vendors/categories': {
      get: {
        summary: 'Get vendor categories',
        description: 'Get available vendor categories',
        tags: ['Vendor & Venue Discovery'],
        responses: {
          '200': {
            description: 'Vendor categories retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Categories retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        categories: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              description: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // INQUIRY ROUTES
    '/inquiries': {
      get: {
        summary: 'Get user inquiries',
        description: 'Get inquiries for the authenticated user (sent or received)',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'sent',
            in: 'query',
            description: 'Filter for sent inquiries (true) or received (false)',
            required: false,
            schema: { type: 'boolean' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Inquiries retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inquiries retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        inquiries: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Inquiry' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create an inquiry',
        description: 'Create a new inquiry to a vendor',
        tags: ['Inquiry, Quotes & Bookings'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateInquiryRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Inquiry created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inquiry created successfully' },
                    data: { $ref: '#/components/schemas/Inquiry' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // AI ROUTES
    '/ai': {
      get: {
        summary: 'Get AI status',
        description: 'Get status of AI services',
        tags: ['AI Planning Assistant'],
        responses: {
          '200': {
            description: 'AI status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'AI status retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['online', 'offline', 'degraded'] },
                        models: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/recommendations': {
      get: {
        summary: 'Get AI recommendations',
        description: 'Get AI recommendations for an event',
        tags: ['AI Planning Assistant'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'eventId',
            in: 'query',
            description: 'Event ID to get recommendations for',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'AI recommendations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Recommendations retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        recommendations: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/AiRecommendation' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        summary: 'Generate AI recommendations',
        description: 'Generate AI recommendations for an event',
        tags: ['AI Planning Assistant'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateAiRecommendationRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Recommendations generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Recommendations generated successfully' },
                    data: { $ref: '#/components/schemas/AiRecommendation' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/ai/budget-allocate': {
      post: {
        summary: 'AI budget allocation',
        description: 'Get AI recommendations for budget allocation',
        tags: ['AI Planning Assistant'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['budget', 'eventType'],
                properties: {
                  budget: { type: 'number', example: 5000 },
                  eventType: { type: 'string', example: 'Wedding' },
                  preferences: {
                    type: 'object',
                    example: { 'catering': 0.4, 'venue': 0.25 },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Budget allocation recommendations provided',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Budget allocation recommendations provided' },
                    data: {
                      type: 'object',
                      properties: {
                        allocation: {
                          type: 'object',
                          example: { 'catering': 2000, 'venue': 1250, 'decor': 1000, 'music': 750 },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // ADMIN ROUTES
    '/admin': {
      get: {
        summary: 'Get admin dashboard',
        description: 'Get admin dashboard overview',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin dashboard retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Dashboard retrieved successfully' },
                    data: { $ref: '#/components/schemas/AdminDashboard' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/analytics/users': {
      get: {
        summary: 'Get user analytics',
        description: 'Get user analytics for admin',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'User analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User analytics retrieved successfully' },
                    data: { $ref: '#/components/schemas/UserAnalytics' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/analytics/vendors': {
      get: {
        summary: 'Get vendor analytics',
        description: 'Get vendor analytics for admin',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendor analytics retrieved successfully' },
                    data: { $ref: '#/components/schemas/VendorAnalytics' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/analytics/bookings': {
      get: {
        summary: 'Get booking analytics',
        description: 'Get booking analytics for admin',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Booking analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Booking analytics retrieved successfully' },
                    data: { $ref: '#/components/schemas/BookingAnalytics' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/analytics/revenue': {
      get: {
        summary: 'Get revenue analytics',
        description: 'Get revenue analytics for admin',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date for analytics period',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Revenue analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Revenue analytics retrieved successfully' },
                    data: { $ref: '#/components/schemas/RevenueAnalytics' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/vendors/{vendorId}/approve': {
      post: {
        summary: 'Approve vendor',
        description: 'Approve a pending vendor',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            description: 'Vendor ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor approved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendor approved successfully' },
                    data: { $ref: '#/components/schemas/Vendor' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/admin/vendors/{vendorId}/reject': {
      post: {
        summary: 'Reject vendor',
        description: 'Reject a pending vendor',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            description: 'Vendor ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor rejected successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Vendor rejected successfully' },
                    data: { $ref: '#/components/schemas/Vendor' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // MODERATION ROUTES
    '/moderation/reports': {
      get: {
        summary: 'Get moderation reports',
        description: 'Get moderation reports for admin review',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Status of reports to retrieve',
            required: false,
            schema: { type: 'string', enum: ['PENDING_REVIEW', 'IN_REVIEW', 'RESOLVED'], default: 'PENDING_REVIEW' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Moderation reports retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Reports retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        reports: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ModerationReport' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/moderation/action-check': {
      post: {
        summary: 'Check user action permission',
        description: 'Check if user can perform a specific action',
        tags: ['Admin Management'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', example: 'CREATE_EVENT' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Action permission checked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Action permission checked successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        canPerform: { type: 'boolean', example: true },
                        restrictions: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // SUBSCRIPTIONS ROUTES
    '/subscriptions': {
      get: {
        summary: 'Get user subscriptions',
        description: 'Get subscription details for authenticated user',
        tags: ['Payment & Monetization'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Subscriptions retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Subscriptions retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        subscriptions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Subscription' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/subscriptions/plans': {
      get: {
        summary: 'Get subscription plans',
        description: 'Get available subscription plans',
        tags: ['Payment & Monetization'],
        responses: {
          '200': {
            description: 'Subscription plans retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Plans retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        plans: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/SubscriptionPlan' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // VENDOR SUBSCRIPTIONS ROUTES
    '/vendor-subscriptions': {
      get: {
        summary: 'Get vendor subscriptions',
        description: 'Get subscription details for vendor',
        tags: ['Payment & Monetization'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Vendor subscriptions retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Subscriptions retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        subscriptions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/VendorSubscription' },
                        },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // EVENT WEBSITE & REGISTRY ROUTES
    '/events/{id}/website': {
      get: {
        summary: 'Get event website',
        description: 'Get event website details',
        tags: ['Event Website & Registry'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Event website retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Website retrieved successfully' },
                    data: { $ref: '#/components/schemas/EventWebsite' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/events/{id}/registry': {
      get: {
        summary: 'Get event registry',
        description: 'Get gift registry for an event',
        tags: ['Event Website & Registry'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Event registry retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registry retrieved successfully' },
                    data: { $ref: '#/components/schemas/EventRegistry' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // REGISTRY ROUTES
    '/registry': {
      get: {
        summary: 'Get user registries',
        description: 'Get registries for the authenticated user',
        tags: ['Event Website & Registry'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Registries retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registries retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        registries: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/EventRegistry' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    
    // PUBLIC EVENT ROUTES
    '/public/events': {
      get: {
        summary: 'Get public events',
        description: 'Get public events that are published',
        tags: ['Event Website & Registry'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'location',
            in: 'query',
            description: 'Filter by location',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'date',
            in: 'query',
            description: 'Filter by date (YYYY-MM-DD)',
            required: false,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Public events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Events retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        events: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Event' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/public/events/{slug}/rsvp': {
      post: {
        summary: 'RSVP to public event',
        description: 'RSVP to a public event',
        tags: ['Event Website & Registry'],
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Event slug',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'rsvp'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  rsvp: { type: 'string', enum: ['YES', 'NO', 'MAYBE'], example: 'YES' },
                  dietaryRestrictions: { type: 'string', example: 'Vegetarian' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'RSVP successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'RSVP successful' },
                    data: { $ref: '#/components/schemas/Rsvp' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // SEATING ROUTES
    '/events/{id}/seating': {
      get: {
        summary: 'Get event seating',
        description: 'Get seating arrangements for an event',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Seating retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Seating retrieved successfully' },
                    data: { $ref: '#/components/schemas/EventSeating' },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    
    // BUDGET ROUTES
    '/budgets': {
      get: {
        summary: 'Get user budgets',
        description: 'Get budgets for the authenticated user',
        tags: ['Event Management'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Budgets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Budgets retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        budgets: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Budget' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                    errors: { type: 'null' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['PLANNER', 'VENDOR', 'ADMIN'] },
          profileImage: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' },
          phone: { type: 'string', example: '+1234567890' },
          isVerified: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Wedding' },
          type: { type: 'string', example: 'Wedding' },
          date: { type: 'string', format: 'date', example: '2025-06-15' },
          location: { type: 'string', example: 'Central Park, New York' },
          budget: { type: 'number', format: 'decimal', example: 5000 },
          guestCount: { type: 'number', example: 100 },
          theme: { type: 'string', example: 'Vintage' },
          notes: { type: 'string', example: 'Special dietary requirements' },
          status: { type: 'string', enum: ['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vendor: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          businessName: { type: 'string', example: 'Gourmet Catering' },
          description: { type: 'string', example: 'Premium catering services' },
          category: { type: 'string', example: 'Catering' },
          pricing: { type: 'number', format: 'decimal', example: 100 },
          location: { type: 'string', example: 'New York, NY' },
          portfolio: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          },
          availability: {
            type: 'object',
            example: {
              monday: { start: '09:00', end: '18:00' },
              tuesday: { start: '09:00', end: '18:00' },
            },
          },
          subscriptionTier: { type: 'string', enum: ['FREE', 'PRO', 'ENTERPRISE'] },
          isVerified: { type: 'boolean', default: false },
          rating: { type: 'number', minimum: 0, maximum: 5, default: 0 },
          totalReviews: { type: 'number', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          vendorId: { type: 'string' },
          amount: { type: 'number', format: 'decimal', example: 500 },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
          paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
          notes: { type: 'string', example: 'Special dietary requirements' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Guest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          name: { type: 'string', example: 'Jane Smith' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          rsvp: { type: 'string', enum: ['YES', 'NO', 'MAYBE'] },
          dietaryRestrictions: { type: 'string' },
          seatNumber: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          title: { type: 'string', example: 'Send invites' },
          description: { type: 'string', example: 'Send wedding invites to all guests' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          dueDate: { type: 'string', format: 'date', example: '2025-05-01' },
          assignedTo: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vendorId: { type: 'string' },
          userId: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', example: 'Excellent service!' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          conversationId: { type: 'string' },
          senderId: { type: 'string' },
          recipientId: { type: 'string' },
          content: { type: 'string', example: 'Hello, are you available?' },
          read: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          participants: {
            type: 'array',
            items: { type: 'string' },
          },
          lastMessage: { type: 'string' },
          lastMessageAt: { type: 'string', format: 'date-time' },
          unreadCount: { type: 'number', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string', example: 'New Message' },
          message: { type: 'string', example: 'You have a new message' },
          type: { type: 'string', enum: ['MESSAGE', 'BOOKING', 'REMINDER', 'SYSTEM'] },
          read: { type: 'boolean', default: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserPreferences: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          notificationSettings: {
            type: 'object',
            properties: {
              email: { type: 'boolean', default: true },
              push: { type: 'boolean', default: true },
              sms: { type: 'boolean', default: false },
            },
          },
          privacySettings: {
            type: 'object',
            properties: {
              profileVisible: { type: 'boolean', default: true },
              showEmail: { type: 'boolean', default: true },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Location: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Central Park' },
          address: { type: 'string', example: 'New York, NY' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
          country: { type: 'string', example: 'US' },
        },
      },
      Currency: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'USD' },
          name: { type: 'string', example: 'US Dollar' },
          symbol: { type: 'string', example: '$' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 50 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      AdminDashboard: {
        type: 'object',
        properties: {
          totalUsers: { type: 'number', example: 1000 },
          totalVendors: { type: 'number', example: 250 },
          totalEvents: { type: 'number', example: 500 },
          totalBookings: { type: 'number', example: 1200 },
          revenue: { type: 'number', example: 50000 },
        },
      },
      UserAnalytics: {
        type: 'object',
        properties: {
          totalUsers: { type: 'number', example: 1000 },
          newUsers: { type: 'number', example: 50 },
          activeUsers: { type: 'number', example: 800 },
          userGrowthRate: { type: 'number', example: 5.2 },
        },
      },
      VendorAnalytics: {
        type: 'object',
        properties: {
          totalVendors: { type: 'number', example: 250 },
          newVendors: { type: 'number', example: 15 },
          verifiedVendors: { type: 'number', example: 180 },
          vendorGrowthRate: { type: 'number', example: 6.5 },
        },
      },
      BookingAnalytics: {
        type: 'object',
        properties: {
          totalBookings: { type: 'number', example: 1200 },
          newBookings: { type: 'number', example: 80 },
          bookingRate: { type: 'number', example: 15.2 },
          avgBookingValue: { type: 'number', example: 450 },
        },
      },
      RevenueAnalytics: {
        type: 'object',
        properties: {
          totalRevenue: { type: 'number', example: 50000 },
          monthlyRevenue: { type: 'number', example: 4200 },
          revenueGrowth: { type: 'number', example: 12.5 },
          revenueByCategory: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { 'catering': 20000, 'venue': 15000, 'decor': 8000 },
          },
        },
      },
      ModerationReport: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reportedUserId: { type: 'string' },
          contentId: { type: 'string' },
          contentType: { type: 'string', enum: ['message', 'profile', 'vendor'] },
          reason: { type: 'string', example: 'Inappropriate content' },
          status: { type: 'string', enum: ['PENDING_REVIEW', 'IN_REVIEW', 'RESOLVED'] },
          reportedBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          planId: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'CANCELLED'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          amount: { type: 'number', example: 9.99 },
          currency: { type: 'string', example: 'USD' },
        },
      },
      SubscriptionPlan: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Premium' },
          description: { type: 'string', example: 'Premium features for vendors' },
          price: { type: 'number', example: 19.99 },
          currency: { type: 'string', example: 'USD' },
          features: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      VendorSubscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vendorId: { type: 'string' },
          planId: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'CANCELLED'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          amount: { type: 'number', example: 29.99 },
          currency: { type: 'string', example: 'USD' },
        },
      },
      EventWebsite: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          name: { type: 'string', example: 'John & Jane\'s Wedding' },
          slug: { type: 'string', example: 'john-jane-wedding' },
          isPublic: { type: 'boolean', default: false },
          theme: { type: 'string', example: 'romantic' },
          customizations: {
            type: 'object',
            additionalProperties: true,
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      EventRegistry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          name: { type: 'string', example: 'Wedding Registry' },
          description: { type: 'string', example: 'Our wedding gift registry' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/RegistryItem' },
          },
          totalContributions: { type: 'number', example: 1500 },
          totalItems: { type: 'number', example: 25 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegistryItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          registryId: { type: 'string' },
          name: { type: 'string', example: 'Kitchen Aid Mixer' },
          price: { type: 'number', example: 200 },
          url: { type: 'string', format: 'uri', example: 'https://example.com/mixer' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
          purchased: { type: 'boolean', default: false },
          purchaser: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Rsvp: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          name: { type: 'string', example: 'John Smith' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          rsvp: { type: 'string', enum: ['YES', 'NO', 'MAYBE'] },
          guestCount: { type: 'number', default: 1 },
          dietaryRestrictions: { type: 'string' },
          message: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      EventSeating: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          layoutType: { type: 'string', enum: ['circular', 'theater', 'classroom', 'banquet'] },
          tables: {
            type: 'array',
            items: { $ref: '#/components/schemas/SeatingTable' },
          },
          guests: {
            type: 'array',
            items: { $ref: '#/components/schemas/Guest' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SeatingTable: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          number: { type: 'string', example: '1' },
          capacity: { type: 'number', example: 8 },
          location: { type: 'string', example: 'front left' },
          guests: {
            type: 'array',
            items: { type: 'string' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Budget: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          name: { type: 'string', example: 'Wedding Budget' },
          totalAmount: { type: 'number', example: 10000 },
          spentAmount: { type: 'number', example: 3500 },
          currency: { type: 'string', example: 'USD' },
          categories: {
            type: 'array',
            items: { $ref: '#/components/schemas/BudgetCategory' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BudgetCategory: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Catering' },
          allocatedAmount: { type: 'number', example: 3000 },
          spentAmount: { type: 'number', example: 1200 },
          currency: { type: 'string', example: 'USD' },
        },
      },
      Inquiry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          senderId: { type: 'string' },
          vendorId: { type: 'string' },
          eventDate: { type: 'string', format: 'date', example: '2025-06-15' },
          budgetRange: { type: 'string', example: '2000-5000' },
          message: { type: 'string', example: 'Looking for catering for 100 guests' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AiRecommendation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          category: { type: 'string', example: 'catering' },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
            example: ['Vendor A', 'Vendor B', 'Vendor C'],
          },
          reason: { type: 'string', example: 'Based on your preferences and budget' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateMessageRequest: {
        type: 'object',
        required: ['to', 'content'],
        properties: {
          to: { type: 'string', example: 'user123' },
          content: { type: 'string', example: 'Hello, are you available?' },
          type: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE'], default: 'TEXT' },
        },
      },
      CreateGuestRequest: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Jane Smith' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          dietaryRestrictions: { type: 'string' },
          inviteType: { type: 'string', enum: ['INDIVIDUAL', 'COUPLE', 'FAMILY'], default: 'INDIVIDUAL' },
        },
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Send invitations' },
          description: { type: 'string', example: 'Send wedding invitations to all guests' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
          dueDate: { type: 'string', format: 'date', example: '2025-05-01' },
          assignedTo: { type: 'string' },
        },
      },
      CreateInquiryRequest: {
        type: 'object',
        required: ['vendorId', 'eventDate', 'message'],
        properties: {
          vendorId: { type: 'string', example: 'vendor123' },
          eventDate: { type: 'string', format: 'date', example: '2025-06-15' },
          budgetRange: { type: 'string', example: '2000-5000' },
          message: { type: 'string', example: 'Looking for catering for 100 guests' },
          guestCount: { type: 'number', example: 100 },
        },
      },
      CreateAiRecommendationRequest: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string', example: 'event123' },
          category: { type: 'string', example: 'catering' },
          preferences: {
            type: 'object',
            additionalProperties: true,
            example: { 'dietary': 'vegetarian', 'style': 'gourmet' },
          },
          budget: { type: 'number', example: 5000 },
        },
      },
      UpdateEventBudgetRequest: {
        type: 'object',
        properties: {
          totalAmount: { type: 'number', example: 10000 },
          currency: { type: 'string', example: 'USD' },
          categories: {
            type: 'array',
            items: { $ref: '#/components/schemas/BudgetCategory' },
          },
        },
      },
      EventBudget: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          totalAmount: { type: 'number', example: 10000 },
          spentAmount: { type: 'number', example: 3500 },
          currency: { type: 'string', example: 'USD' },
          categories: {
            type: 'array',
            items: { $ref: '#/components/schemas/BudgetCategory' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad Request - Invalid input data',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Invalid input data' },
                data: { type: 'null' },
                errors: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                  example: {
                    field: 'Error message',
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Authentication required' },
                data: { type: 'null' },
                errors: { type: 'null' },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Insufficient permissions' },
                data: { type: 'null' },
                errors: { type: 'null' },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Not Found - Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Resource not found' },
                data: { type: 'null' },
                errors: { type: 'null' },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET(_request: NextRequest) {
  return new Response(JSON.stringify(openApiSpec), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.oai.openapi+json',
    },
  });
}