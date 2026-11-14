import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Bep Nha Backend API',
    description: 'Tài liệu API tự động - Hệ thống quản lý nhà hàng',
    version: '1.0.0',
  },
  host: 'localhost:5000',
  schemes: ['http'],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Chỉ cần dán chuỗi token vào, không cần gõ chữ Bearer'
      }
    }
  },

  security: [{ bearerAuth: [] }]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/app.js'];

swaggerAutogen()(outputFile, endpointsFiles, doc);