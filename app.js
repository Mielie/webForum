const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const {
	fetchUserDetails,
	fetchUserGroups,
	fetchAllUserDetails,
	fetchUserDetailsByUsername,
	fetchUserGroupsByUsername,
	setUserPassword,
	setUserPasswordByUsername,
} = require("./controllers/userController");
const { customErrorHandler } = require("./controllers/errorController");

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

app.post("/api/setpassword", setUserPassword);

app.post(
	"/api/users/:username/setpassword",
	passport.authenticate("jwt", { session: false }),
	setUserPasswordByUsername
);

app.get(
	"/api/users",
	passport.authenticate("jwt", { session: false }),
	fetchAllUserDetails
);

app.get(
	"/api/users/:username",
	passport.authenticate("jwt", { session: false }),
	fetchUserDetailsByUsername
);

app.get(
	"/api/users/:username/groups",
	passport.authenticate("jwt", { session: false }),
	fetchUserGroupsByUsername
);

app.get(
	"/api/user",
	passport.authenticate("jwt", { session: false }),
	fetchUserDetails
);

app.get(
	"/api/user/groups",
	passport.authenticate("jwt", { session: false }),
	fetchUserGroups
);

app.get(
	"/api/whoami",
	passport.authenticate("jwt", { session: false }),
	(request, response, next) => {
		response.status(200).send({ user: request.user });
	}
);

app.use(customErrorHandler);

module.exports = app;
