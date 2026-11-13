import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { User, Rider } from '../models';
import { hashPassword, app, resetDb, createBaseFixture } from './helpers';
import { ROLES } from '../config/constants';
import { signToken } from '../services/auth.service';

async function dispatchAndDeliver(fixture: Awaited<ReturnType<typeof createBaseFixture>>, paymentMethod = 'CASH') {
  const { customer, staff, rider, restaurant, foodItem, customerAddress } = fixture;
  const created = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      restaurantId: restaurant.id,
      items: [{ foodItemId: foodItem.id, quantity: 1 }],
      addressId: customerAddress.id,
      paymentMethod
    });
  const { id } = created.body.data;
  if (paymentMethod === 'CARD') {
    await request(app)
      .post(`/api/payments/orders/${id}/process`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ cardNumber: '4242424242424242', cardName: 'TEST USER', expiry: '08/27', cvv: '123' });
  }
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
  return { id, deliveryId: null as number | null };
}

describe('Deliveries', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lets the assigned rider progress the delivery', async () => {
    const fixture = await createBaseFixture();
    const { rider } = fixture;
    const { id } = await dispatchAndDeliver(fixture);

    const list = await request(app).get('/api/deliveries').set('Authorization', `Bearer ${rider.token}`);
    const data = Array.isArray(list.body.data) ? list.body.data : list.body.data.items;
    const delivery = data.find((d: { orderId: number }) => d.orderId === id);
    expect(delivery).toBeTruthy();
    expect(delivery.status).toBe('ASSIGNED');

    const res = await request(app)
      .put(`/api/deliveries/${delivery.id}/status`)
      .set('Authorization', `Bearer ${rider.token}`)
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('rejects invalid transitions', async () => {
    const fixture = await createBaseFixture();
    const { rider } = fixture;
    const { id } = await dispatchAndDeliver(fixture);

    const list = await request(app).get('/api/deliveries').set('Authorization', `Bearer ${rider.token}`);
    const data = Array.isArray(list.body.data) ? list.body.data : list.body.data.items;
    const delivery = data.find((d: { orderId: number }) => d.orderId === id);

    const res = await request(app)
      .put(`/api/deliveries/${delivery.id}/status`)
      .set('Authorization', `Bearer ${rider.token}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    expect(res.status).toBe(400);
  });

  it('forbids a different rider from updating the delivery', async () => {
    const fixture = await createBaseFixture();
    const { rider, admin } = fixture;
    const { id } = await dispatchAndDeliver(fixture);

    const otherUser = await User.create({
      firstName: 'Rival',
      lastName: 'Rider',
      email: 'rival@gidieats.test',
      phone: '+2348123456700',
      passwordHash: await hashPassword('Demo@123'),
      role: ROLES.RIDER
    });
    const otherRider = await Rider.create({ userId: otherUser.id });
    const otherToken = signToken(otherUser);

    const list = await request(app)
      .get('/api/deliveries')
      .set('Authorization', `Bearer ${rider.token}`);
    const data = Array.isArray(list.body.data) ? list.body.data : list.body.data.items;
    const delivery = data.find((d: { orderId: number }) => d.orderId === id);
    expect(delivery).toBeTruthy();

    const res = await request(app)
      .put(`/api/deliveries/${delivery.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(403);

    // The other rider does not see other people's deliveries in their list
    const scoped = await request(app).get('/api/deliveries').set('Authorization', `Bearer ${otherToken}`);
    const scopedData = Array.isArray(scoped.body.data) ? scoped.body.data : scoped.body.data.items;
    expect(scopedData.length).toBe(0);

    void admin;
  });

  it('lets staff view deliveries for their restaurant', async () => {
    const fixture = await createBaseFixture();
    const { staff } = fixture;
    await dispatchAndDeliver(fixture);
    const res = await request(app).get('/api/deliveries').set('Authorization', `Bearer ${staff.token}`);
    expect(res.status).toBe(200);
    const data = Array.isArray(res.body.data) ? res.body.data : res.body.data.items;
    expect(data.length).toBe(1);
  });
});