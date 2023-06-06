const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

require("./passport");

app.post("/api/auth", (req, res, next) => {
	passport.authenticate("local", { session: false }, (err, user, info) => {
		if (err || !user) {
			return res.status(401).send({ msg: info.message });
		}
		req.login(user, { session: false }, (err) => {
			if (err) {
				res.send(err);
			}

			let tokenExpiry = user.session_timeout_value;

			if (user.password_timeout_value) {
				const lastPasswordSet = new Date(user.last_password_set);
				const secondsSinceSet = (new Date() - lastPasswordSet) / 1000;
				const remainingSeconds = Math.floor(
					user.password_timeout_value - secondsSinceSet
				);
				tokenExpiry =
					tokenExpiry > remainingSeconds
						? remainingSeconds
						: tokenExpiry;
			}

			const token = jwt.sign(
				{ username: user.username },
				process.env.JWT_SECRET,
				{
					expiresIn: tokenExpiry,
				}
			);
			return res
				.status(200)
				.send({ user: { username: user.username }, token });
		});
	})(req, res);
});

app.get(
	"/api/whoami",
	passport.authenticate("jwt", { session: false }),
	(request, response) => {
		response.status(200).send({ user: request.user });
	}
);

module.exports = app;
