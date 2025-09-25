import request from 'supertest';
import app from '../app.js';

describe('Auth flow', () => {
  it('health works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
