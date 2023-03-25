const request = require('supertest');
const app = require('../../app');
require('dotenv').config();

// simple test
test('sums two values', () => {
  expect(1 + 2).toBe(3);
});

describe('GET /', () => {
  test('responds with status 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
  test('responds with a message', async () => {
    const response = await request(app).get('/');
    expect(response.body.message).toBe('Welcome to the quality life comparison API!');
  });
});

describe('Non existent endpoint', () => {
  test('responds with status 404', async () => {
    const response = await request(app).get('/not-found');
    expect(response.status).toBe(404);
  });
});

describe('POST /login', () => {
  test('responds with status 200', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: process.env.LOGIN, password: process.env.PASSWORD });
    expect(response.status).toBe(200);
  });
  test('responds with a token', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: process.env.LOGIN, password: process.env.PASSWORD });
    expect(response.body.token).toBeDefined();
  });
  test('responds with status 401', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'wrong', password: 'wrong' });
    expect(response.status).toBe(401);
  });
});

describe('POST /search', () => {
  test('responds with status 200', async () => {
    const response = await request(app)
      .post('/search')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({ firstCity: 'Paris', secondCity: 'London' });
    expect(response.status).toBe(200);
  });
  test('responds with a comparison', async () => {
    const response = await request(app)
      .post('/search')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({ firstCity: 'Paris', secondCity: 'London' });
    expect(response.body).toHaveProperty('firstCity');
    expect(response.body).toHaveProperty('secondCity');
    expect(response.body).toHaveProperty('comparisonResults');
  });
  test('responds with status 400', async () => {
    const response = await request(app)
      .post('/search')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({ firstCity: 'Paris' });
    expect(response.status).toBe(400);
  });
});
