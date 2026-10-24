import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Credentials API', () => {
  let tokenUserA: string;
  let tokenUserB: string;
  let categoryIdUserA: string;

  const sampleEncryptedPayload = {
    ciphertext: 'U2FsdGVkX1+vUpp++zZ0Xlq8...',
    iv: 'dGVzdElWMTIzNDU2',
    authTag: 'YXV0aFRhZzEyMzQ1Njc4',
    version: 1
  };

  beforeEach(async () => {
    // User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'cred_a@example.com',
      password: 'Password123!',
      vaultSalt: 'c2FsdF91c2VyX2FfMTZieXRlcw=='
    });
    tokenUserA = resA.body.data.token;

    // User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'cred_b@example.com',
      password: 'Password123!',
      vaultSalt: 'c2FsdF91c2VyX2JfMTZieXRlcw=='
    });
    tokenUserB = resB.body.data.token;

    // User A Category
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Work Accounts' });
    categoryIdUserA = catRes.body.data._id;
  });

  it('should create a new credential and retrieve it', async () => {
    const createRes = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Work Gmail',
        website: 'https://gmail.com',
        categoryId: categoryIdUserA,
        encryptedSecretPayload: sampleEncryptedPayload,
        favorite: true
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Work Gmail');
    expect(createRes.body.data.favorite).toBe(true);
    expect(createRes.body.data.encryptedSecretPayload.ciphertext).toBe(sampleEncryptedPayload.ciphertext);

    const credentialId = createRes.body.data._id;

    // Read by ID
    const getRes = await request(app)
      .get(`/api/credentials/${credentialId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe('Work Gmail');
    expect(getRes.body.data.lastUsedAt).toBeDefined();
  });

  it('should filter credentials by category, favorites, and search', async () => {
    // Create multiple items
    await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'GitHub Work',
        website: 'github.com',
        categoryId: categoryIdUserA,
        encryptedSecretPayload: sampleEncryptedPayload,
        favorite: true
      });

    await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Personal Netflix',
        website: 'netflix.com',
        encryptedSecretPayload: sampleEncryptedPayload,
        favorite: false
      });

    // Test favorite filter
    const favRes = await request(app)
      .get('/api/credentials?favorite=true')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(favRes.status).toBe(200);
    expect(favRes.body.data.length).toBe(1);
    expect(favRes.body.data[0].title).toBe('GitHub Work');

    // Test search filter
    const searchRes = await request(app)
      .get('/api/credentials?search=netflix')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].title).toBe('Personal Netflix');
  });

  it('should prevent cross-user access (User B cannot read, modify, or delete User A items)', async () => {
    const createRes = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Confidential Server Key',
        encryptedSecretPayload: sampleEncryptedPayload
      });

    const credId = createRes.body.data._id;

    // User B tries to read
    const readRes = await request(app)
      .get(`/api/credentials/${credId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);
    expect(readRes.status).toBe(404);

    // User B tries to update
    const patchRes = await request(app)
      .patch(`/api/credentials/${credId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ title: 'Hacked Title' });
    expect(patchRes.status).toBe(404);

    // User B tries to delete
    const deleteRes = await request(app)
      .delete(`/api/credentials/${credId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);
    expect(deleteRes.status).toBe(404);
  });

  it('should toggle favorite status', async () => {
    const createRes = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'AWS Console',
        encryptedSecretPayload: sampleEncryptedPayload,
        favorite: false
      });

    const credId = createRes.body.data._id;

    const toggleRes = await request(app)
      .post(`/api/credentials/${credId}/favorite`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.favorite).toBe(true);

    const toggleOffRes = await request(app)
      .post(`/api/credentials/${credId}/favorite`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(toggleOffRes.status).toBe(200);
    expect(toggleOffRes.body.data.favorite).toBe(false);
  });

  it('should reject credential creation if category belongs to another user', async () => {
    // User B tries to assign User A's category
    const crossCatRes = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({
        title: 'Illicit Item',
        categoryId: categoryIdUserA,
        encryptedSecretPayload: sampleEncryptedPayload
      });

    expect(crossCatRes.status).toBe(400);
  });

  it('should reject malformed encrypted payloads', async () => {
    const res = await request(app)
      .post('/api/credentials')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Invalid Item',
        encryptedSecretPayload: {
          ciphertext: '', // missing ciphertext
          iv: 'short'
        }
      });

    expect(res.status).toBe(422);
  });
});
