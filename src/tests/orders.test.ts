import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';

const CARD = { cardNumber: '4242424242424242', cardName: 'TEST USER', expiry: '08/27', cvv: '123' };

async function createOrder(fixture: Awaited<ReturnType<typeof createBaseFixture>>, overrides: Record<string, unknown> = {}) {
  const { customer, restaurant, foodItem, customerAddress } = fixture;
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      restaurantId: restaurant.id,
      items: [{ foodItemId: foodItem.id, quantity: 2 }],
      addressId: customerAddress.id,
      paymentMethod: 'CARD',
      ...overrides
    });
  return res;
}

async function deliveryIdFor(o: { id: number }, riderToken: string): Promise<number> {
  const list = await request(app).get('/api/deliveries').set('Authorization', `Bearer ${riderToken}`);
  const data = Array.isArray(list.body.data) ? list.body.data : list.body.data.items;
  const mine = data.filter((d: { orderId: number }) => d.orderId === o.id);
  expect(mine.length).toBe(1);
  return mine[0].id;
}

describe('Order lifecycle', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates an order with computed totals', async () => {
    const fixture = await createBaseFixture();
    const res = await createOrder(fixture);
    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.status).toBe('PENDING');
    expect(Number(order.subtotal)).toBe(5000);
    expect(Number(order.serviceFee)).toBe(250);
    expect(Number(order.total)).toBe(5750);
  });

  it('rejects items from another restaurant', async () => {
    const fixture = await createBaseFixture();
    const { customer, restaurant, otherFoodItem, customerAddress } = fixture;
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        restaurantId: restaurant.id,
        items: [{ foodItemId: otherFoodItem.id, quantity: 1 }],
        addressId: customerAddress.id,
        paymentMethod: 'CARD'
      });
    expect(res.status).toBe(400);
  });

  it('requires an address for delivery', async () => {
    const fixture = await createBaseFixture();
    const { customer, restaurant, foodItem } = fixture;
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        restaurantId: restaurant.id,
        items: [{ foodItemId: foodItem.id, quantity: 1 }],
        paymentMethod: 'CASH'
      });
    expect(res.status).toBe(400);
  });

  it('blocks staff from confirming an unpaid card order', async () => {
    const fixture = await createBaseFixture();
    const { staff } = fixture;
    const created = (await createOrder(fixture)).body.data;
    const res = await request(app)
      .put(`/api/orders/${created.id}/status`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(400);
  });

  it('drives a card order through to delivery', async () => {
    const fixture = await createBaseFixture();
    const { customer, staff, rider } = fixture;
    const created = (await createOrder(fixture)).body.data;
    const { id } = created;

    const pay = await request(app)
      .post(`/api/payments/orders/${id}/process`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send(CARD);
    expect(pay.status).toBe(200);
    expect(pay.body.data.status).toBe('SUCCESS');

    const afterPay = await request(app).get(`/api/orders/${id}`).set('Authorization', `Bearer ${customer.token}`);
    expect(afterPay.body.data.status).toBe('CONFIRMED');

    for (const status of ['PREPARING', 'READY_FOR_PICKUP'] as const) {
      const r = await request(app)
        .put(`/api/orders/${id}/status`)
        .set('Authorization', `Bearer ${staff.token}`)
        .send({ status });
      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe(status);
    }

    const assign = await request(app)
      .post(`/api/orders/${id}/assign-rider`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ riderId: rider.profile!.id });
    expect(assign.status).toBe(200);
    expect(assign.body.data.status).toBe('RIDER_ASSIGNED');

    const deliveryId = await deliveryIdFor({ id }, rider.token);
    for (const status of ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const) {
      const r = await request(app)
        .put(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${rider.token}`)
        .send({ status });
      expect(r.status).toBe(200, `transition to ${status}`);
    }

    const done = await request(app).get(`/api/orders/${id}`).set('Authorization', `Bearer ${customer.token}`);
    expect(done.body.data.status).toBe('DELIVERED');
  });

  it('collects cash payment on delivery', async () => {
    const fixture = await createBaseFixture();
    const { customer, staff, rider } = fixture;
    const created = (await createOrder(fixture, { paymentMethod: 'CASH' })).body.data;
    const { id } = created;

    for (const status of ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as const) {
      await request(app)
        .put(`/api/orders/${id}/status`)
        .set('Authorization', `Bearer ${staff.token}`)
        .send({ status });
    }
    await request(app)
      .post(`/api/orders/${id}/assign-rider`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ riderId: rider.profile!.id });

    const deliveryId = await deliveryIdFor({ id }, rider.token);
    for (const status of ['ACCEPTED', 'PICKED_UP'] as const) {
      await request(app)
        .put(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${rider.token}`)
        .send({ status });
    }
    const payList = await request(app)
      .get(`/api/payments`)
      .set('Authorization', `Bearer ${customer.token}`);
    const before = Array.isArray(payList.body.data) ? payList.body.data : payList.body.data.items;
    const pending = before.find((p: { orderId?: number; order?: { id: number } }) =>
      (p.orderId ?? p.order?.id) === id);
    expect(pending.status).toBe('PENDING');

    await request(app)
      .put(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', `Bearer ${rider.token}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    const deliver = await request(app)
      .put(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', `Bearer ${rider.token}`)
      .send({ status: 'DELIVERED' });

    const payAfter = await request(app)
      .get(`/api/payments`)
      .set('Authorization', `Bearer ${customer.token}`);
    const after = Array.isArray(payAfter.body.data) ? payAfter.body.data : payAfter.body.data.items;
    const settled = after.find((p: { orderId?: number; order?: { id: number } }) =>
      (p.orderId ?? p.order?.id) === id);
    expect(deliver.status).toBe(200);
    expect(settled.status).toBe('SUCCESS');
  });

  it('lets a customer cancel a pending card order', async () => {
    const fixture = await createBaseFixture();
    const { customer } = fixture;
    const created = (await createOrder(fixture)).body.data;
    const res = await request(app)
      .post(`/api/orders/${created.id}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ reason: 'Changed my mind' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('blocks cancellation after dispatch', async () => {
    const fixture = await createBaseFixture();
    const { customer, staff, rider } = fixture;
    const created = (await createOrder(fixture, { paymentMethod: 'CASH' })).body.data;
    const { id } = created;

    for (const status of ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as const) {
      await request(app)
        .put(`/api/orders/${id}/status`)
        .set('Authorization', `Bearer ${staff.token}`)
        .send({ status });
    }
    await request(app)
      .post(`/api/orders/${id}/assign-rider`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ riderId: rider.profile!.id });

    const res = await request(app)
      .post(`/api/orders/${id}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('lets staff reject a pending order', async () => {
    const fixture = await createBaseFixture();
    const { staff } = fixture;
    const created = (await createOrder(fixture)).body.data;
    const res = await request(app)
      .put(`/api/orders/${created.id}/status`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ status: 'REJECTED', reason: 'Out of stock' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');
  });

  it('forbids staff of another restaurant from managing the order', async () => {
    const fixture = await createBaseFixture();
    const { otherStaff } = fixture;
    const created = (await createOrder(fixture)).body.data;
    const res = await request(app)
      .put(`/api/orders/${created.id}/status`)
      .set('Authorization', `Bearer ${otherStaff.token}`)
      .send({ status: 'REJECTED' });
    expect(res.status).toBe(403);
  });

  it('hides another customer\'s order when fetched by id', async () => {
    const fixture = await createBaseFixture();
    const created = (await createOrder(fixture)).body.data;
    const res = await request(app)
      .get(`/api/orders/${created.id}`)
      .set('Authorization', `Bearer ${fixture.otherCustomer.token}`);
    expect(res.status).toBe(404);
  });

  it('returns the customer\'s paginated order list scoped to their orders', async () => {
    const fixture = await createBaseFixture();
    await createOrder(fixture);
    await createOrder(fixture);
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${fixture.otherCustomer.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});