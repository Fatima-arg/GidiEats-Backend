import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';

describe('Dashboards', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns admin overview metrics', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${fixture.admin.token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.counts.totalOrders).toBe('number');
    expect(typeof res.body.data.revenue.total).toBe('number');
    expect(Array.isArray(res.body.data.charts.statusDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.charts.sales30)).toBe(true);
  });

  it('keeps admin reports away from non-admins', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard/reports').set('Authorization', `Bearer ${fixture.customer.token}`);
    expect(res.status).toBe(403);
    const staff = await request(app).get('/api/dashboard/reports').set('Authorization', `Bearer ${fixture.staff.token}`);
    expect(staff.status).toBe(403);
  });

  it('returns a neutral dashboard stub for customers', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${fixture.customer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('CUSTOMER');
  });

  it('returns staff-restaurant-scoped data', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${fixture.staff.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.restaurantId).toBe(fixture.restaurant.id);
  });

  it('returns rider-scoped data', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${fixture.rider.token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.counts.totalAssignments).toBe('number');
  });

  it('returns admin reports', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).get('/api/dashboard/reports').set('Authorization', `Bearer ${fixture.admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.revenueByRestaurant)).toBe(true);
    expect(Array.isArray(res.body.data.ordersByRestaurant)).toBe(true);
    expect(Array.isArray(res.body.data.paymentsByMethod)).toBe(true);
  });
});