import app from './app.js';
import { ENV } from './config/env.js';
import { seedDemoData } from './config/seed.js';

const port = ENV.PORT || 4000;

(async () => {
  await seedDemoData();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
})();
