import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';

describe('Auth', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('registers a new customer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Ngozi',
      lastName: 'Okeke',
      email: 'ngozi@example.com',
      phone: '+2348123456789',
      password: 'Password1'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects duplicate emails with 409', async () => {
    await createBaseFixture();
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Dup',
      lastName: 'User',
      email: 'customer@gidieats.test',
      phone: '+2348123456788',
      password: 'Password1'
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('validates password strength', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Weak',
      lastName: 'Password',
      email: 'weak@gidieats.test',
      phone: '+2348123456787',
      password: 'short'
    });
    expect(res.status).toBe(422);
  });

  it('logs in with correct credentials', async () => {
    const { customer } = await createBaseFixture();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.user.email, password: 'Demo@123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(customer.user.email);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const { customer } = await createBaseFixture();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.user.email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown emails', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@gidieats.test', password: 'Demo@123' });
    expect(res.status).toBe(401);
  });

  it('returns the current user profile with token', async () => {
    const { customer } = await createBaseFixture();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(customer.user.email);
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});