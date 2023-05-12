const express = require("express");
const passport = require("passport");

require("./passport");

const app = express();

app.use(express.json());

app.post("/api/auth", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).send({ msg: info.message });
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        res.send(err);
      }
      return res.status(200).send({ user });
    });
  })(req, res);
});

app.get("/api", (request, response) => {
	response.status(200).send({ message: "all ok" });
});

module.exports = app;
