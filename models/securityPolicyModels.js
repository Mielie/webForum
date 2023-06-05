const db = require("../db/connection");

exports.fetchConfig = () => {
	return db
		.query(`SELECT * FROM security_policies;`)
		.then(({ rows, rowCount }) => {
			if (!rowCount) {
				return Promise.reject("no security policy found");
			}
			return rows[0];
		});
};
