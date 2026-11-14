import swaggerAutogen from 'swagger-autogen';

// Kiểm tra xem có đang chạy trên Render không (Render tự set biến RENDER)
const isProduction = process.env.RENDER || process.env.NODE_ENV === 'production';
// Lấy URL của Render nếu có, nếu không thì dùng localhost
const productionUrl = process.env.RENDER_EXTERNAL_URL || 'https://restaurant-ordering-kitchen-management.onrender.com';

const doc = {
  info: {
    title: 'Bep Nha Backend API',
    description: 'Tài liệu API tự động - Hệ thống quản lý nhà hàng',
    version: '1.0.0',
  },
  // Sử dụng mảng servers thay vì host/schemes để linh hoạt hơn
  servers: [
    {
      url: isProduction ? productionUrl : 'http://localhost:5000',
      description: isProduction ? 'Production Server' : 'Local Server'
    }
  ],
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

// Bật OpenAPI 3.0 để hỗ trợ mảng servers
swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);