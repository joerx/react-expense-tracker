let res = db.createUser({
  user: "expense",
  pwd: "expense",
  roles: ["readWrite"],
});

printjson(res);
