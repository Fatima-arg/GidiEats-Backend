import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';

describe('Restaurants & menu', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lists approved restaurants', async () => {
    const { restaurant } = await createBaseFixture();
    const res = await request(app).get('/api/restaurants');
    expect(res.status).toBe(200);
    const items = Array.isArray(res.body.data) ? res.body.data : res.body.data.items;
    expect(items.some((r: { id: number }) => r.id === restaurant.id)).toBe(true);
  });

  it('searches restaurants by name', async () => {
    await createBaseFixture();
    const res = await request(app).get('/api/restaurants').query({ search: 'Other Kitchen' });
    expect(res.status).toBe(200);
    const items = Array.isArray(res.body.data) ? res.body.data : res.body.data.items;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Other Kitchen');
  });

  it('returns a restaurant menu with categories and food items', async () => {
    const { restaurant, foodItem, category } = await createBaseFixture();
    const res = await request(app).get(`/api/restaurants/${restaurant.id}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.restaurant.id).toBe(restaurant.id);
    const cats = res.body.data.categories as { id: number; name: string; foodItems: { id: number }[] }[];
    const found = cats.find((c) => c.id === category.id);
    expect(found).toBeTruthy();
    expect(found!.foodItems.map((i) => i.id)).toContain(foodItem.id);
  });

  it('exposes delivery fee on the restaurant detail', async () => {
    const { restaurant } = await createBaseFixture();
    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);
    expect(res.status).toBe(200);
    expect(Number(res.body.data.deliveryFee)).toBe(500);
  });

  it('allows an admin to create a restaurant', async () => {
    const { admin } = await createBaseFixture();
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'New Spot',
        slug: 'new-spot',
        description: 'Brand new joint',
        phone: '+2348000000111',
        email: 'new@gidieats.test',
        addressStreet: '9 New Road',
        addressCity: 'Danbare',
        addressState: 'Kano',
        cuisineType: 'Fast Food',
        deliveryFee: 600,
        deliveryTimeMin: 35,
        opensAt: '09:00',
        closesAt: '23:00'
      });
    expect(res.status).toBe(201);
  });

  it('links a staff-created restaurant to their account', async () => {
    const { staff } = await createBaseFixture();
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({
        name: 'Nope',
        slug: 'nope',
        phone: '+2348000000112',
        email: 'nope@gidieats.test',
        addressStreet: '1 Nope Road',
        addressCity: 'Kofar Kabuga',
        addressState: 'Kano',
        cuisineType: 'Fast Food',
        deliveryFee: 600,
        deliveryTimeMin: 35,
        opensAt: '09:00',
        closesAt: '23:00'
      });
    expect(res.status).toBe(201);
  });

  it('allows a restaurant staff to update their own menu item', async () => {
    const { staff, foodItem } = await createBaseFixture();
    const res = await request(app)
      .put(`/api/food-items/${foodItem.id}`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ price: 3200, description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.price)).toBe(3200);
  });

  it('forbids a restaurant staff from updating another restaurant item', async () => {
    const { staff, otherFoodItem } = await createBaseFixture();
    const res = await request(app)
      .put(`/api/food-items/${otherFoodItem.id}`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ price: 100 });
    expect(res.status).toBe(403);
  });
});