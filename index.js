const dotenv = require("dotenv");
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { json } = require("body-parser");
const saltRounds = 10;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "userId",
    secret: "subscribe",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const resultenv = dotenv.config();
const hostname = process.env.HOST;
const port = process.env.PORT;
const Sessionssecret = process.env.SESSION_SECRET;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Mysql Connected...");
});

//-----------------------------------------------AUTHENTICATION----------------------------------------------------
app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM admin WHERE username =?;",
    username,
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }
      if ((result.length = 0)) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.log(err);
          }

          db.query(
            "INSERT INTO admin (username, password) VALUES (?,?)",
            [username, hash],
            (err, result) => {
              console.log(err);
            }
          );
        });
      }
    }
  );
});

const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    res.send("Need a Token!");
  } else {
    jwt.verify(token, `${Sessionssecret}`, (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "failed authenticate" });
      } else {
        req.userID = decoded.username;
        res.json({ user: req.userID, auth: true });
        next();
      }
    });
  }
};

app.get("/isUserAuth", verifyJWT, (req, res) => {});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM admin WHERE username = ?;",
    username,
    (err, result) => {
      console.log(result);
      if (err) {
        res.send({ err: err });
        console.log(err);
      }
      if (result.length > 0) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.log(err);
          }

          bcrypt.compare(password, result[0].password, (error, response) => {
            console.log(password + " pass");
            console.log(hash + " hash");
            console.log(result[0].password);
            if (response) {
              /* console.log("Entrou");
            const id = result[0].username;*/
              const token = jwt.sign({ username }, `${Sessionssecret}`, {
                expiresIn: 300, // 5 min
              });

              req.session.user = result;

              res.json({
                auth: true,
                token: token,
                message: "Login com Sucesso",
                result: result,
              });
            } else {
              res.json({
                auth: false,
                message: "Username e/ou Password Errados!",
              });
            }
          });
        });
      } else {
        res.json({ auth: false, message: "Não existe este user" });
      }
    }
  );
});
//---------------------------User----------------------------------------
app.post("/createUser", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const tlm = req.body.tlm;
  const tipo = req.body.tipo;

  db.query(
    "INSERT INTO `User`(`Name`, `Email`, `PassWord`, `PhoneNumber`, `Tipo`) VALUES (?,?,?,?,?)",
    [name, email, password, tlm, tipo],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json("Utilizador Criado!");
      }
    }
  );
});

app.get("/users", (req, res) => {
  db.query("SELECT * FROM `User`;", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.delete("/deleteUser/:iduser", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM `User` WHERE ?;", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      res.json(`User id: ${id} foi eliminado!`);
    }
  });
});

//---------------------------Atleta--------------------------------------
app.post("/createatleta", (req, res) => {
  const name = req.body.name;
  const age = req.body.age;
  const country = req.body.country;
  const position = req.body.position;
  const wage = req.body.wage;

  db.query(
    "INSERT INTO `Athlete`(`idAthlete`, `Name`, `PhoneNumber`, `Email`, `Height`, `Weight`, `ArmSpan`, `idPhysicalData`, `BirthDate`, `idUser`) VALUES ([value-1],[value-2],[value-3],[value-4],[value-5],[value-6],[value-7],[value-8],[value-9],[value-10])",
    [name, age, country, position, wage],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

app.get("/atletas", (req, res) => {
  db.query("SELECT * FROM vcvv1.athlete;", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.put("/updateatleta", (req, res) => {
  const id = req.body.id;
  const wage = req.body.wage;
  db.query(
    "UPDATE employees SET wage = ? WHERE id = ?",
    [wage, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.delete("/delete/:idatleta", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM employees WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.listen(port, () => {
  console.log(`runnig server! http://${hostname}:${port}/`);

  if (resultenv.error) {
    throw resultenv.error;
  }

  console.log(resultenv.parsed);
});
