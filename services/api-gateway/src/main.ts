import { config } from './infrastructure/config/env';
import { createApp } from './infrastructure/http/app';

const app = createApp();

if (config.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Wayvo API Gateway running on port ${config.PORT}`);
    console.log(`   Node Env:             ${config.NODE_ENV}`);
    console.log(`   Booking Service URL:  ${config.BOOKING_SERVICE_URL}`);
    console.log(`   Trip Service URL:     ${config.TRIP_SERVICE_URL}`);
    console.log(`   Provider Service URL: ${config.PROVIDER_SERVICE_URL}`);
    console.log(`   AI Service URL:       ${config.AI_SERVICE_URL}`);
    console.log(`   Mock Fallback:        ${config.ENABLE_MOCK_FALLBACK ? 'ENABLED' : 'DISABLED'}`);
    console.log(`=========================================`);
  });
}

export { app };
