import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Categories API', () => {
  let tokenUserA: string;
  let tokenUserB: string;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'usera@example.com',
      password: 'Password123!',
      vaultSalt: 'c2FsdF91c2VyX2FfMTZieXRlcw=='
    });
    tokenUserA = resA.body.data.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'userb@example.com',
      password: 'Password123!',
      vaultSalt: 'c2FsdF91c2VyX2JfMTZieXRlcw=='
    });
    tokenUserB = resB.body.data.token;
  });

  it('should allow user to create a category and list categories', async () => {
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        name: 'Social Media',
        icon: 'share-2',
        color: '#e11d48'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Social Media');

    const listRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(listRes.status).toBe(200);
    const names = listRes.body.data.map((c: any) => c.name);
    expect(names).toContain('Social Media');
  });

  it('should prevent duplicate category name for the same user', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Gaming' });

    const duplicateRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Gaming' });

    expect(duplicateRes.status).toBe(409);
  });

  it('should prevent cross-user category access/modification', async () => {
    // User A creates a category
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'User A Secret Category' });

    const categoryId = catRes.body.data._id;

    // User B tries to update User A's category
    const hackUpdateRes = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ name: 'Hacked Category' });

    expect(hackUpdateRes.status).toBe(404); // Kept as 404 to avoid leaking existence

    // User B tries to delete User A's category
    const hackDeleteRes = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(hackDeleteRes.status).toBe(404);
  });

  it('should reject invalid category ID format', async () => {
    const res = await request(app)
      .get('/api/categories/not-a-valid-id')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect([400, 404, 422]).toContain(res.status);
  });
});
