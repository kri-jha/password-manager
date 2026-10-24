import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

const app = createApp();

describe('Authentication API', () => {
  const validUser = {
    email: 'alice@example.com',
    password: 'Password123!',
    vaultSalt: 'bm9uY2Vfc2FsdF8xNmJ5dGVzX2xvbmc=',
    vaultAuthVerifier: {
      ciphertext: 'testCiphertext',
      iv: 'testIv12345678',
      authTag: 'testAuthTag12345',
      version: 1
    }
  };

  it('should register a new user successfully with Argon2id hashing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.token).toBeDefined();

    // Verify cookies set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('auth_token');

    // Verify password hash is never in response
    expect(res.body.data.user.accountPasswordHash).toBeUndefined();

    // Verify user stored in DB with argon2id hash
    const dbUser = await User.findOne({ email: 'alice@example.com' }).select('+accountPasswordHash');
    expect(dbUser).not.toBeNull();
    expect(dbUser?.accountPasswordHash).toContain('$argon2id$');
  });

  it('should reject duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak password or invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
      vaultSalt: 'short'
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should login an existing user with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.accountPasswordHash).toBeUndefined();
  });

  it('should deny login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'WrongPassword999!'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should enforce authentication on /api/auth/me', async () => {
    // Unauthenticated
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);

    // Authenticated
    const regRes = await request(app).post('/api/auth/register').send(validUser);
    const token = regRes.body.data.token;

    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.email).toBe('alice@example.com');
    expect(authRes.body.data.accountPasswordHash).toBeUndefined();
  });
});
