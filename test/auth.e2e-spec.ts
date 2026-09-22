import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const user = {
    email: 'auth-e2e@example.com',
    password: 'Password123',
    name: 'Auth E2E User',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register creates a user without returning the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    expect(response.body).toMatchObject({
      email: user.email,
      name: user.name,
    });
    expect(response.body).not.toHaveProperty('password');
  });

  it('POST /auth/register rejects a repeated email without returning 500', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(409);

    expect(response.status).not.toBe(500);
  });

  it('POST /auth/login returns access and refresh tokens', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('POST /auth/login rejects invalid credentials with a generic message', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'WrongPassword123' })
      .expect(401);

    expect(response.body.message).toBe('Invalid email or password');
  });

  it('POST /auth/refresh rejects an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' })
      .expect(401);
  });

  it('POST /auth/logout invalidates the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(401);
  });

  it('GET /orders rejects requests without an access token', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
  });
});
