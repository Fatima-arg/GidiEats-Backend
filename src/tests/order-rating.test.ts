import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, createBaseFixture, type BaseFixture } from './helpers';
import { Order, OrderRating, Restaurant, Rider } from '../models';

describe('Order & delivery rating', () => {
  beforeEach(async () => {
    await resetDb();
  });

  const deliveredOrder = async (fixture: BaseFixture) => {
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
    await Order.update(
      { status: 'DELIVERED' as const, riderId: fixture.riderProfile.id },
      { where: { id: created.id } }
    );
    return created;
  };

  it('lets the customer rate food and delivery on a delivered order', async () => {
    const fixture = await createBaseFixture();
    const created = await deliveredOrder(fixture);

    const res = await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({ rating: 5, deliveryRating: 4, comment: 'Lovely jollof, fast rider' });
    expect(res.status).toBe(200);
    expect(res.body.data.rating.rating).toBe(5);
    expect(res.body.data.rating.deliveryRating).toBe(4);
    expect(res.body.data.rating.comment).toBe('Lovely jollof, fast rider');

    const restaurant = await Restaurant.findByPk(fixture.restaurant.id);
    expect(restaurant!.ratingCount).toBe(11);
    expect(Number(restaurant!.rating)).toBeCloseTo(4.27, 2);

    const rider = await Rider.findByPk(fixture.riderProfile.id);
    expect(rider!.ratingCount).toBe(1);
    expect(Number(rider!.rating)).toBe(4);

    expect(await OrderRating.count({ where: { orderId: created.id } })).toBe(1);
  });

  it('updates a rating instead of counting it twice', async () => {
    const fixture = await createBaseFixture();
    const created = await deliveredOrder(fixture);

    await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({ rating: 4 });

    const before = await Restaurant.findByPk(fixture.restaurant.id);
    const edited = await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({ rating: 2 });
    expect(edited.status).toBe(200);

    const after = await Restaurant.findByPk(fixture.restaurant.id);
    expect(before!.ratingCount).toBe(11);
    expect(after!.ratingCount).toBe(11);
    expect(Number(after!.rating)).toBeCloseTo(4.0, 2);
    expect(await OrderRating.count({ where: { orderId: created.id } })).toBe(1);
  });

  it('rejects rating before the order is delivered', async () => {
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

    const res = await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.customer.token}`)
      .send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  it('blocks another customer from rating an order they do not own', async () => {
    const fixture = await createBaseFixture();
    const created = await deliveredOrder(fixture);

    const res = await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.otherCustomer.token}`)
      .send({ rating: 5 });
    expect(res.status).toBe(403);
  });

  it('blocks staff from rating an order', async () => {
    const fixture = await createBaseFixture();
    const created = await deliveredOrder(fixture);

    const res = await request(app)
      .post(`/api/orders/${created.id}/rating`)
      .set('Authorization', `Bearer ${fixture.staff.token}`)
      .send({ rating: 5 });
    expect(res.status).toBe(403);
  });
});