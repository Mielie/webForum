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

exports.getUserByUsername = (username) => {
	return db
		.query(
			`SELECT * FROM users
			WHERE username = $1;`,
			[username.toLowerCase()]
		)
		.then(({ rows, rowCount }) => {
			if (rowCount) {
				delete rows[0].salt;
				delete rows[0].password;
				return rows[0];
			}
			return Promise.reject({ status: 404, msg: "No user found" });
		});
};

exports.getUserAndPolicyByUsername = (username) => {
	return db
		.query(
			`SELECT * FROM users JOIN security_policies USING (policy_id) WHERE username = $1`,
			[username.toLowerCase()]
		)
		.then(({ rows, rowCount }) => {
			if (rowCount) {
				return rows[0];
			}
			return Promise.reject({ status: 404, msg: "No user found" });
		});
};

exports.getUserGroups = (username) => {
	return db
		.query(
			`SELECT groups.group_id, groups.description FROM groups JOIN user_groups USING (group_id) WHERE user_id=$1;`,
			[username]
		)
		.then(({ rows, rowCount }) => {
			return rows;
		});
};

exports.getAllUserDetails = () => {
	return db.query(`SELECT * FROM users;`).then(({ rows, rowCount }) => {
		return rows.map((user) => {
			delete user.salt;
			delete user.password;
			return user;
		});
	});
};

exports.checkUserGroupMembership = (username, group) => {
	return db
		.query(`SELECT * FROM user_groups WHERE user_id=$1 AND group_id=$2;`, [
			username,
			group,
		])
		.then(({ row, rowCount }) => {
			if (rowCount) {
				return true;
			}
			return Promise.reject({
				status: 401,
				msg: `User is not in ${group} group`,
			});
		});
};

exports.updateUserPassword = (username, salt, password) => {
	return db.query(
		`UPDATE users SET salt=$1,password=$2,last_password_set=$3 WHERE username=$4;`,
		[salt, password, new Date(), username]
	);
};
