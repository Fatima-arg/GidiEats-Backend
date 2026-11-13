import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture } from './helpers';
import { Order } from '../models';

const CARD = { cardNumber: '4242424242424242', cardName: 'GUEST USER', expiry: '08/27', cvv: '123' };

const GUEST_ADDRESS = {
  name: 'Fatima Adam Aminu',
  phone: '+2348099999999',
  street: '7 Danbare Campus Road',
  city: 'BUK New Site',
  state: 'Kano'
};

describe('Guest checkout', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates an order without auth using name, phone and address', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).post('/api/orders').send({
      restaurantId: fixture.restaurant.id,
      items: [{ foodItemId: fixture.foodItem.id, quantity: 2 }],
      deliveryAddress: GUEST_ADDRESS,
      paymentMethod: 'CASH'
    });
    expect(res.status).toBe(201);
    expect(res.body.data.customerId).toBeNull();
    expect(res.body.data.status).toBe('PENDING');
    expect(Number(res.body.data.total)).toBe(5750);
  });

  it('keeps authenticated order creation working with saved addresses', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({
        restaurantId: fixture.restaurant.id,
        items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
        addressId: fixture.customerAddress.id,
        paymentMethod: 'CARD'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.customerId).toBe(fixture.customerProfile.id);
  });

  it('rejects guests who omit a delivery address', async () => {
    const fixture = await createBaseFixture();
    const res = await request(app).post('/api/orders').send({
      restaurantId: fixture.restaurant.id,
      items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
      paymentMethod: 'CASH'
    });
    expect(res.status).toBe(400);
  });

  it('lets a guest track their order by number + phone', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CASH'
        })
    ).body.data;

    const ok = await request(app)
      .post('/api/orders/track')
      .send({ orderNumber: created.orderNumber, phone: GUEST_ADDRESS.phone });
    expect(ok.status).toBe(200);
    expect(ok.body.data.orderNumber).toBe(created.orderNumber);
    expect(ok.body.data.items).toHaveLength(1);
    expect(ok.body.data.restaurant.name).toBe(fixture.restaurant.name);

    const bad = await request(app)
      .post('/api/orders/track')
      .send({ orderNumber: created.orderNumber, phone: '+2348000000000' });
    expect(bad.status).toBe(404);
  });

  it('lists a guest previous orders from their delivery phone', async () => {
    const fixture = await createBaseFixture();
    const place = (address: typeof GUEST_ADDRESS) =>
      request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: address,
          paymentMethod: 'CASH'
        });

    await place(GUEST_ADDRESS);
    await place(GUEST_ADDRESS);
    await place({ ...GUEST_ADDRESS, phone: '+2348011111111' });

    const history = await request(app).post('/api/orders/track/history').send({ phone: GUEST_ADDRESS.phone });
    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0].items).toHaveLength(1);
    expect(history.body.data[0].restaurant.name).toBe(fixture.restaurant.name);

    const unknown = await request(app).post('/api/orders/track/history').send({ phone: '+2348000000000' });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data).toHaveLength(0);
  });

  it('pays for a guest card order via the public guest endpoint', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CARD'
        })
    ).body.data;

    const pay = await request(app)
      .post(`/api/payments/guest/orders/${created.id}/process`)
      .send({ ...CARD, phone: GUEST_ADDRESS.phone });
    expect(pay.status).toBe(200);
    expect(pay.body.data.status).toBe('SUCCESS');
  });

  it('rejects guest card payment when the phone does not match', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CARD'
        })
    ).body.data;

    const pay = await request(app)
      .post(`/api/payments/guest/orders/${created.id}/process`)
      .send({ ...CARD, phone: '+2348000000000' });
    expect(pay.status).toBe(403);
  });

  it('does not allow guests to pay for a logged-in customer order', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${fixture.customer.token}`)
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          addressId: fixture.customerAddress.id,
          paymentMethod: 'CARD'
        })
    ).body.data;

    const pay = await request(app)
      .post(`/api/payments/guest/orders/${created.id}/process`)
      .send({ ...CARD, phone: fixture.customerAddress.phone });
    expect(pay.status).toBe(403);
  });
});

describe('Customer accepts delivery', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const markDelivered = async (orderId: number) =>
    Order.update({ status: 'DELIVERED' as const }, { where: { id: orderId } });

  it('lets a guest accept their delivered order with the correct phone', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CASH'
        })
    ).body.data;
    await markDelivered(created.id);

    const accepted = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .send({ phone: GUEST_ADDRESS.phone });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.customerConfirmedAt).toBeTruthy();

    const again = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .send({ phone: GUEST_ADDRESS.phone });
    expect(again.status).toBe(200);
  });

  it('rejects a guest who uses the wrong phone', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CASH'
        })
    ).body.data;
    await markDelivered(created.id);

    const bad = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .send({ phone: '+2348000000000' });
    expect(bad.status).toBe(403);
  });

  it('rejects acceptance before the order is delivered', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          deliveryAddress: GUEST_ADDRESS,
          paymentMethod: 'CASH'
        })
    ).body.data;

    const early = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .send({ phone: GUEST_ADDRESS.phone });
    expect(early.status).toBe(400);
  });

  it('lets the logged-in owner accept a delivered order without a phone', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${fixture.customer.token}`)
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          addressId: fixture.customerAddress.id,
          paymentMethod: 'CASH'
        })
    ).body.data;
    await markDelivered(created.id);

    const accepted = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .set('Authorization', `Bearer ${fixture.customer.token}`);
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.customerConfirmedAt).toBeTruthy();
  });

  it('blocks another customer from accepting an order they do not own', async () => {
    const fixture = await createBaseFixture();
    const created = (
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${fixture.customer.token}`)
        .send({
          restaurantId: fixture.restaurant.id,
          items: [{ foodItemId: fixture.foodItem.id, quantity: 1 }],
          addressId: fixture.customerAddress.id,
          paymentMethod: 'CASH'
        })
    ).body.data;
    await markDelivered(created.id);

    const other = await request(app)
      .post(`/api/orders/${created.id}/confirm-receipt`)
      .set('Authorization', `Bearer ${fixture.otherCustomer.token}`);
    expect(other.status).toBe(403);
  });
});