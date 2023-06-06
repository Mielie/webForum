const passport = require("passport");
const crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const db = require("./db/connection");
const {
  updateIncorrectPasswordAttempts,
  updateLastLoginAttempt,
} = require("./models/userModels");
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

passport.use(
  new LocalStrategy((username, password, done) => {
    return db
      .query(
        `SELECT * FROM users JOIN security_policies USING (policy_id) WHERE username = $1`,
        [username.toLowerCase()]
      )
      .then(({ rows, rowCount }) => {
        if (!rowCount) {
          done(null, false, { message: "Incorrect username or password" });
          return;
        }
        const user = rows[0];

        if (user.account_locked) {
          done(null, false, { message: "Account locked" });
          return;
        }

        updateLastLoginAttempt(username, new Date());
        if (user.incorrect_logins >= user.max_login_attempts) {
          const lastLoginAttempt = new Date(user.last_login_attempt);
          lastLoginAttempt.setSeconds(
            lastLoginAttempt.getSeconds() + user.login_timeout_value
          );
          if (new Date() < lastLoginAttempt) {
            done(null, false, { message: "Too many incorrect passwords" });
            return;
          }
        }

        const { hashedPassword } = passwordHasher(password, user.salt);

        if (user.password === hashedPassword) {
          updateIncorrectPasswordAttempts(username, 0).then(() => {
            if (user.password_timeout_value) {
              const passwordExpiryDate =
                +new Date(user.last_password_set) +
                (user.password_timeout_value ?? 0);
              if (new Date() > passwordExpiryDate) {
                done(null, false, { message: "Password has expired" });
                return;
              }
            }

            done(null, user, { message: "Login successful" });
            return;
          });
        } else {
          const newIncorrectLogins = user.incorrect_logins + 1;
          updateIncorrectPasswordAttempts(username, newIncorrectLogins).then(
            () => {
              done(null, false, { message: "Incorrect username or password" });
            }
          );
        }
      });
  })
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwtPayload, cb) => {
      return db
        .query(`SELECT account_locked FROM users WHERE username=$1;`, [
          jwtPayload.username,
        ])
        .then(({ rows, rowCount }) => {
          if (!rowCount) {
            return cb(null, false, { message: "Account no longer exists" });
          }
          const user = rows[0];

          if (user.account_locked) {
            return cb(null, false, { message: "Account locked" });
          }
          return cb(null, jwtPayload);
        });
    }
  )
);

const passwordHasher = (
  password,
  salt = crypto.randomBytes(16).toString("hex")
) => {
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 310000, 32, "sha256")
    .toString("hex");
  return { salt, hashedPassword };
};

module.exports = { passwordHasher };
