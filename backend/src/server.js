import app from './app.js';
import { ENV } from './config/env.js';

const port = ENV.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
