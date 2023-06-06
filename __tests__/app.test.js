const app = require("../app");
const request = require("supertest");
const testData = require("../db/data/test-data/");
const seed = require("../db/seeding/seed");
const db = require("../db/connection");

beforeAll(() => seed(testData));

afterAll(() => db.end());

describe("Local strategy password authentication", () => {
	describe("POST: 200", () => {
		it("should return a 200 and user object if correct username and password is provided", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body }) => {
					const { user, token } = body;
					expect(typeof token).toBe("string");
					expect(user.username).toBe(credentials.username);
				});
		});
		it("should return a 200 and user object if correct username/password is provided after password timeout has expired", () => {
			const credentials = {
				username: "testuser3",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body }) => {
					const { user, token } = body;
					expect(typeof token).toBe("string");
					expect(user.username).toBe(credentials.username);
				});
		});
		it("should reset the incorrect logins parameter", () => {
			return db
				.query(
					"SELECT incorrect_logins FROM users WHERE username='testuser3'"
				)
				.then(({ rows }) => {
					const { incorrect_logins } = rows[0];
					expect(incorrect_logins).toBe(0);
				});
		});
		it("should set the correct session time", () => {
			const credentials = {
				username: "testuser3",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body }) =>
					request(app)
						.get("/api/whoami")
						.set("Authorization", "Bearer " + body.token)
						.expect(200)
						.then(
							({
								body: {
									user: { iat, exp },
								},
							}) => {
								expect(exp - iat).toBe(600);
							}
						)
				);
		});
	});
	describe("POST: 401", () => {
		it("should return a 401 if the user does not exist", () => {
			const credentials = {
				username: "notauser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(401)
				.then(({ body }) => {
					const { msg } = body;
					expect(msg).toBe("Incorrect username or password");
				});
		});
		it("should return a 401 if the incorrect password is provided", () => {
			const credentials = {
				username: "testuser2",
				password: "password1234",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(401)
				.then(({ body }) => {
					const { msg } = body;
					expect(msg).toBe("Incorrect username or password");
				});
		});
		it("should increment the incorrect_logins number", () => {
			return db
				.query(
					"SELECT incorrect_logins FROM users WHERE username='testuser2';"
				)
				.then(({ rows }) => {
					const { incorrect_logins } = rows[0];
					expect(incorrect_logins).toBe(3);
				});
		});
		it("should return a message if the user has reached the limit of incorrect passwords", () => {
			const credentials = {
				username: "testuser2",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(401)
				.then(({ body }) => {
					const { msg } = body;
					expect(msg).toBe("Too many incorrect passwords");
				});
		});
		it("should return a 401 if the password has expired", () => {
			const credentials = {
				username: "testuser4",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(401)
				.then(({ body }) => {
					const { msg } = body;
					expect(msg).toBe("Password has expired");
				});
		});
		it("should return a 401 if the users account is locked", () => {
			const credentials = {
				username: "testuser5",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(401)
				.then(({ body }) => {
					const { msg } = body;
					expect(msg).toBe("Account locked");
				});
		});
	});
});

describe("JSON web token authentication strategy", () => {
	describe("GET: 200", () => {
		it("should return a 200 when passed a valid token", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};

			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) =>
					request(app)
						.get("/api/whoami")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(
							({
								body: {
									user: { username },
								},
							}) => {
								expect(username).toBe(credentials.username);
							}
						)
				);
		});
	});
	describe("GET: 401", () => {
		it("should return a 401 when not passed a token", () => {
			return request(app).get("/api/whoami").expect(401);
		});

		it("should return a 401 when passed an invalid token", () => {
			return request(app)
				.get("/api/whoami")
				.set("Authorization", "Bearer " + "invalid token")
				.expect(401);
		});

		it("should return a 401 when user account is locked", () => {
			const credentials = {
				username: "testuser6",
				password: "password123",
			};

			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) =>
					db
						.query(
							`UPDATE users SET account_locked=true WHERE username=$1`,
							[credentials.username]
						)
						.then(() =>
							request(app)
								.get("/api/whoami")
								.set("Authorization", "Bearer " + token)
								.expect(401)
						)
				);
		});
	});
});
