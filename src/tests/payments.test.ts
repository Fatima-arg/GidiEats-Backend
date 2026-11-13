import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';

const GOOD_CARD = { cardNumber: '4242424242424242', cardName: 'TEST USER', expiry: '08/27', cvv: '123' };

async function placedOrder() {
  const fixture = await createBaseFixture();
  const { customer, restaurant, foodItem, customerAddress } = fixture;
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      restaurantId: restaurant.id,
      items: [{ foodItemId: foodItem.id, quantity: 1 }],
      addressId: customerAddress.id,
      paymentMethod: 'CARD'
    });
  return { fixture, order: res.body.data };
}

describe('Payments', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('processes a card payment and auto-confirms the order', async () => {
    const { fixture, order } = await placedOrder();
    const res = await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send(GOOD_CARD);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUCCESS');
    expect(res.body.data.provider).toBe('GIDIPAY');
  });

  it('rejects malformed card details', async () => {
    const { fixture, order } = await placedOrder();
    const res = await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({ cardNumber: '123', cardName: 'TEST', expiry: '08/27', cvv: '123' });
    expect(res.status).toBe(422);
  });

  it('does not double-charge a completed payment', async () => {
    const { fixture, order } = await placedOrder();
    const first = await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send(GOOD_CARD);
    expect(first.status).toBe(200);
    const second = await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send(GOOD_CARD);
    expect(second.status).toBe(409);
  });

  it('rejects payments from another customer', async () => {
    const { fixture, order } = await placedOrder();
    const res = await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.otherCustomer.token}`)
      .send(GOOD_CARD);
    expect(res.status).toBe(403);
  });

  it('cannot process online payment for a cash order', async () => {
    const fixture = await createBaseFixture();
    const { customer, restaurant, foodItem, customerAddress } = fixture;
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        restaurantId: restaurant.id,
        items: [{ foodItemId: foodItem.id, quantity: 1 }],
        addressId: customerAddress.id,
        paymentMethod: 'CASH'
      });
    const res = await request(app)
      .post(`/api/payments/orders/${created.body.data.id}/process`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send(GOOD_CARD);
    expect(res.status).toBe(400);
  });

  it('scopes the payment list for customers and staff', async () => {
    const { fixture, order } = await placedOrder();
    await request(app)
      .post(`/api/payments/orders/${order.id}/process`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send(GOOD_CARD);

    const mine = await request(app).get('/api/payments').set('Authorization', `Bearer ${fixture.customer.token}`);
    const myList = Array.isArray(mine.body.data) ? mine.body.data : mine.body.data.items;
    expect(myList.length).toBe(1);

    const theirs = await request(app).get('/api/payments').set('Authorization', `Bearer ${fixture.otherCustomer.token}`);
    const theirList = Array.isArray(theirs.body.data) ? theirs.body.data : theirs.body.data.items;
    expect(theirList.length).toBe(0);

    const staff = await request(app).get('/api/payments').set('Authorization', `Bearer ${fixture.staff.token}`);
    const staffList = Array.isArray(staff.body.data) ? staff.body.data : staff.body.data.items;
    expect(staffList.length).toBe(1);
  });
});