const app = require("../app");
const request = require("supertest");
const testData = require("../db/data/test-data/");
const seed = require("../db/seeding/seed");
const db = require("../db/connection");

beforeAll(() => seed(testData));

afterAll(() => db.end());
