const db = require("../connection");
const format = require("pg-format");

const seed = ({ userData, securityPolicyData, groupData, userGroupsData }) => {
  return db
    .query("DROP TABLE IF EXISTS user_groups;")
    .then(() => {
      return db.query("DROP TABLE IF EXISTS groups;");
    })
    .then(() => {
      return db.query("DROP TABLE IF EXISTS users;");
    })
    .then(() => {
      return db.query("DROP TABLE IF EXISTS security_policies;");
    })
    .then(() => {
      return db.query(`
        CREATE TABLE security_policies (
          policy_id SERIAL PRIMARY KEY,
          max_login_attempts INT DEFAULT 3 NOT NULL,
          login_timeout_value INT DEFAULT 60 NOT NULL,
          session_timeout_value INT DEFAULT 604800 NOT NULL,
          password_criteria VARCHAR,
          password_timeout_value INT
        );`);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE groups (
          group_id VARCHAR PRIMARY KEY,
          description VARCHAR
        );`);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE users (
          username VARCHAR PRIMARY KEY,
          password VARCHAR,
          account_locked BOOLEAN DEFAULT false NOT NULL,
          incorrect_logins INT DEFAULT 0 NOT NULL,
          last_login_attempt TIMESTAMPTZ DEFAULT NOW(),
          last_password_set TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          salt VARCHAR,
          policy_id INT NOT NULL REFERENCES security_policies(policy_id)
        );`);
    })
    .then(() => {
      return db.query(`
        CREATE TABLE user_groups (
          user_id VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
          group_id VARCHAR NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE
        );`);
    })
    .then(() => {
      return db.query(
        format(
          "INSERT INTO security_policies (policy_id, max_login_attempts, login_timeout_value, session_timeout_value, password_criteria, password_timeout_value) VALUES %L;",
          securityPolicyData.map(
            ({
              policyId,
              maxLoginAttempts,
              loginTimeoutValue,
              sessionTimeoutValue,
              passwordCrit,
              passwordTimeoutValue,
            }) => [
              policyId,
              maxLoginAttempts,
              loginTimeoutValue,
              sessionTimeoutValue,
              passwordCrit,
              passwordTimeoutValue,
            ]
          )
        )
      );
    })
    .then(() => {
      return db.query(
        format(
          "INSERT INTO users (username, password, salt, incorrect_logins, last_login_attempt, last_password_set, account_locked, policy_id) VALUES %L;",
          userData.map(
            ({
              username,
              password,
              salt,
              incorrectLogins,
              lastLoginAttempt,
              lastPasswordSet,
              accountLocked,
              policyId,
            }) => [
              username,
              password,
              salt,
              incorrectLogins,
              lastLoginAttempt,
              lastPasswordSet,
              accountLocked,
              policyId,
            ]
          )
        )
      );
    })
    .then(() => {
      return db.query(
        format(
          "INSERT INTO groups (group_id, description) VALUES %L;",
          groupData.map(({ group, description }) => [group, description])
        )
      );
    })
    .then(() => {
      return db.query(
        format(
          "INSERT INTO user_groups (user_id, group_id) VALUES %L;",
          userGroupsData.map(({ username, group }) => [username, group])
        )
      );
    });
};

module.exports = seed;
