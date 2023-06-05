const db = require("../db/connection");

exports.updateIncorrectPasswordAttempts = (username, num) => {
	return db
		.query(
			`UPDATE users
		SET incorrect_logins = $1
		WHERE username = $2
		RETURNING *;`,
			[num, username]
		)
		.then(({ rows }) => {
			return rows[0];
		});
};

exports.updateLastLoginAttempt = (username, num) => {
	return db
		.query(
			`UPDATE users
		SET last_login_attempt = $1
		WHERE username = $2
		RETURNING *;
		`,
			[num, username]
		)
		.then(({ rows }) => {
			return rows[0];
		});
};
