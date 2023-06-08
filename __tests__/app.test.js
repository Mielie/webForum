const app = require("../app");
const request = require("supertest");
const testData = require("../db/data/test-data/");
const seed = require("../db/seeding/seed");
const db = require("../db/connection");

beforeAll(() => seed(testData));

afterAll(() => db.end());

describe("Local password authentication strategy", () => {
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

describe("/api/user", () => {
	describe("GET: 200", () => {
		it("should return 200 and a user object when correctly authenticated", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/user")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(({ body: { user } }) => {
							expect(user).toHaveProperty(
								"username",
								credentials.username
							);
							expect(user).toHaveProperty(
								"account_locked",
								expect.any(Boolean)
							);
							expect(user).toHaveProperty(
								"incorrect_logins",
								expect.any(Number)
							);
							expect(user).toHaveProperty(
								"last_login_attempt",
								expect.any(String)
							);
							expect(user).toHaveProperty(
								"last_password_set",
								expect.any(String)
							);
							expect(user).toHaveProperty(
								"policy_id",
								expect.any(Number)
							);
							expect(user).not.toHaveProperty("password");
							expect(user).not.toHaveProperty("salt");
						});
				});
		});
	});
	describe("GET: 401", () => {
		it("should return 401 if no token is provided", () => {
			return request(app).get("/api/user").expect(401);
		});
	});
});

describe("/api/users", () => {
	describe("GET: 200", () => {
		it("should return a list of users when requested by an administrator", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(({ body: { users } }) => {
							expect(Array.isArray(users)).toBe(true);
						});
				});
		});
	});

	describe("GET: 401", () => {
		it("should return 401 is a user who is not in the administrator group tries to access endpoint", () => {
			const credentials = {
				username: "testuser3",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users")
						.set("Authorization", "Bearer " + token)
						.expect(401)
						.then(({ body: { msg } }) => {
							expect(msg).toBe(
								"User is not in Administrator group"
							);
						});
				});
		});
	});
});

describe("/api/users/:username", () => {
	describe("GET: 200", () => {
		it("should return 200 and the user details when requested by an administrator", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/testuser2")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(({ body: { user } }) => {
							expect(user.username).toBe("testuser2");
							expect(user).not.toHaveProperty("salt");
							expect(user).not.toHaveProperty("password");
						});
				});
		});
	});

	describe("GET: 401", () => {
		it("should return 401 when requested by non-administrator", () => {
			const credentials = {
				username: "testuser3",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/testuser2")
						.set("Authorization", "Bearer " + token)
						.expect(401)
						.then(({ body: { msg } }) => {
							expect(msg).toBe(
								"User is not in Administrator group"
							);
						});
				});
		});
	});

	describe("GET: 404", () => {
		it("should return 404 if user does not exist", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/notavaliduser")
						.set("Authorization", "Bearer " + token)
						.expect(404)
						.then(({ body: { msg } }) => {
							expect(msg).toBe("No user found");
						});
				});
		});
	});
});

describe("/api/users/:username/groups", () => {
	describe("GET: 200", () => {
		it("should return 200 and the groups a user is a member of if the requester is an Administrator", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/testuser2/groups")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(({ body: { groups } }) => {
							expect(groups).toEqual([
								{
									group_id: "User",
									description: "Base user group",
								},
							]);
						});
				});
		});
	});

	describe("GET: 401", () => {
		it("should return 401 if requestor is not an administrator", () => {
			const credentials = {
				username: "testuser3",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/testuser2/groups")
						.set("Authorization", "Bearer " + token)
						.expect(401)
						.then(({ body: { msg } }) => {
							expect(msg).toBe(
								"User is not in Administrator group"
							);
						});
				});
		});
	});

	describe("GET: 404", () => {
		it("should return 404 if the user is not a valid user", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/users/notavaliduser/groups")
						.set("Authorization", "Bearer " + token)
						.expect(404)
						.then(({ body: { msg } }) => {
							expect(msg).toBe("No user found");
						});
				});
		});
	});
});

describe("/api/user/groups", () => {
	describe("GET: 200", () => {
		it("should return 200 and a list of all the groups the user is a member of", () => {
			const credentials = {
				username: "testuser",
				password: "password123",
			};
			return request(app)
				.post("/api/auth")
				.send(credentials)
				.expect(200)
				.then(({ body: { token } }) => {
					return request(app)
						.get("/api/user/groups")
						.set("Authorization", "Bearer " + token)
						.expect(200)
						.then(({ body: { groups } }) => {
							expect(groups).toEqual([
								{
									group_id: "Administrator",
									description: "Default superuser group",
								},
								{
									group_id: "User",
									description: "Base user group",
								},
							]);
						});
				});
		});
	});
});

describe("/api/setpassword", () => {
	describe("POST: 200", () => {
		it("should update the user password when given valid user credentials and a valid password", () => {
			const credentials = {
				username: "testuser",
				oldPassword: "password123",
				newPassword: "Blinded=ab1",
			};
			return request(app)
				.post("/api/setpassword")
				.send(credentials)
				.expect(200)
				.then(({ body: { msg } }) => {
					expect(msg).toBe("Password successfully changed");
				});
		});
	});
	describe("POST: 400", () => {
		it("should return a 400 if the password does not meet complexity requirements", () => {
			const credentials = {
				username: "testuser2",
				oldPassword: "password123",
				newPassword: "Blindedab1",
			};
			return request(app)
				.post("/api/setpassword")
				.send(credentials)
				.expect(400)
				.then(({ body: { msg } }) => {
					expect(msg).toBe(
						"New password does not meet complexity requirements"
					);
				});
		});
	});
	describe("POST: 401", () => {
		it("should return a 401 if the old password is incorrect", () => {
			const credentials = {
				username: "testuser",
				oldPassword: "password123",
				newPassword: "Blinded=ab1",
			};
			return request(app)
				.post("/api/setpassword")
				.send(credentials)
				.expect(401)
				.then(({ body: { msg } }) => {
					expect(msg).toBe("Incorrect username or password");
				});
		});
	});
});
