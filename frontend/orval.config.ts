export default {
  studyAssistantApi: {
    input: 'http://localhost:8000/openapi.json', // URL backend FastAPI
    output: {
      target: './src/api/api.ts',
      schemas: './src/api/api.schemas.ts',
      client: 'axios',
    },
  },
};
