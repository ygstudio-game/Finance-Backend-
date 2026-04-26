import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Data Processing API',
      version: '1.0.0',
      description: `
API documentation for the Finance Dashboard Assessment.

### 🔐 Authentication for First Use:
To test protected routes (like creating users or records), you must identify as an **ADMIN**.
1. Click the **"Authorize"** button (top right).
2. Enter this Seeded Admin ID: \`5dc7ac90-c08b-4be4-a9aa-32d83cfbec28\`
3. Click **Authorize** and then **Close**.

Now you can click **"Try it out"** on any endpoint!
      `,
    },
    servers: [
      {
        url: (process.env.NODE_ENV === "development") ? 'http://localhost:5000' : process.env.RENDER_EXTERNAL_URL,
        description: process.env.NODE_ENV === "development" ? 'Local Development Server' : 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        xUserIdHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-id',
          description: 'Custom header for mock authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string' },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        xUserIdHeader: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts'],
};

export const swaggerDocs = swaggerJSDoc(options);
