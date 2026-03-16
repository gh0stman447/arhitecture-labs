import { createSwaggerSpec } from 'next-swagger-doc'

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Architecture Labs API',
        version: '1.0.0',
        description: 'Трёхзвенная архитектура с аутентификацией, электронной цифровой подписью и курсами валют',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Profile: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['admin', 'moderator', 'viewer'] },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  })
}
