const db = require("../connection");
const format = require("pg-format");

const seed = ({ userData }) => {
	return db.query("DROP TABLE IF EXISTS users;").then(() => {
		return db.query(`
      CREATE TABLE users (
        username VARCHAR PRIMARY KEY,
        password VARCHAR,
        salt VARCHAR
      );`);
	}).then(() => {
    return db.query(format(
        "INSERT INTO users (username, password, salt) VALUES %L;",
        userData.map(({ username, password, salt }) => [username, password, salt])
      ))
  });
};

module.exports = seed;
