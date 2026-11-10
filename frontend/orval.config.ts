export default {
  studyAssistantApi: {
    input: process.env.ORVAL_INPUT ?? 'http://localhost:8000/openapi.json', // FastAPI OpenAPI spec
    output: {
      target: './src/api/api.ts',
      schemas: './src/api/api.schemas.ts',
      client: 'axios',
    },
  },
};
