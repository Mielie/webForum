const passport = require("passport");
const crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const db = require("./db/connection");
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

passport.use(
  new LocalStrategy((username, password, done) => {
    return db
      .query(`SELECT * FROM users WHERE username = $1`, [
        username.toLowerCase(),
      ])
      .then(({ rows, rowCount }) => {
        if (!rowCount) {
          done(null, false, { message: "Incorrect username or password" });
        } else {
          const user = rows[0];
          const { hashedPassword } = passwordHasher(password, user.salt);
          if (user.password === hashedPassword) {
            done(null, user, { message: "Login successful" });
          }
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
      return cb(null, jwtPayload);
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