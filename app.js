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
    origin: ["http://volleyadmin.sarapaiva.webtuga.net"],
    methods: ["GET", "POST", "DELETE", "PUT"],
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
    "SELECT * FROM `admin` WHERE username = ?;",
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
//---------------------------UserPAIS----------------------------------------
app.post("/createUserPais", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const PhoneNumber = req.body.PhoneNumber;

  console.log(
    "name: " +
      name +
      " email: " +
      email +
      " pass: " +
      password +
      " " +
      PhoneNumber
  );

  db.query("SELECT * FROM User WHERE Email = ?", email, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    console.log(result);
    if (result.length == 0) {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.log(err);
        }
        db.query(
          "INSERT INTO `User`(`Name`, `Email`, `PassWord`, `PhoneNumber`, `Tipo`) VALUES (?,?,?,?,0)",
          [name, email, hash, PhoneNumber],
          (err, result) => {
            if (err) {
              console.log(err);
            }
            res.json({
              mensagemStatus: "Enc. Educação Registado!",
            });
          }
        );
      });
    } else {
      res.json({
        mensagemStatus: "Já existe este Email!",
      });
    }
  });
});

app.get("/usersPais", (req, res) => {
  db.query("SELECT * FROM `User` WHERE Tipo = 0", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/deleteUser", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `User` WHERE idUser=?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`Utilizador de id: ${id} foi eliminado!`);
    }
  });
});

//---------------------------Atleta--------------------------------------

app.get("/getidpai", (req, res) => {
  db.query(
    "SELECT `idUser`, `Name` FROM `User` WHERE Tipo = 0",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        var dataCas = [];
        for (var i = 0; i < result.length; i++) {
          dataCas.push(
            JSON.parse(
              `{"value":${result[i].idUser}, "label": "${result[i].Name}"}`
            )
          );
        }
        console.log(dataCas);

        res.json(dataCas);
      }
    }
  );
});

app.post("/createatleta", (req, res) => {
  const nameAtl = req.body.nameAtl;
  const Height = req.body.Height;
  const Weight = req.body.Weight;
  const ArmSpan = req.body.ArmSpan;
  const BirthDate = req.body.BirthDate;
  const idUser = req.body.idUser;
  const idTeam = req.body.idTeam;

  db.query("SELECT * FROM User WHERE Email = ?", email, (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (result.length == 0) {
      db.query(
        "INSERT INTO `Athlete`(`NameAtl`, `Height`, `Weight`, `ArmSpan`, `BirthDate`, `idUser`, `idteam`) VALUES (?,?,?,?,?,?,?,?,?)",
        [nameAtl, Height, Weight, ArmSpan, BirthDate, idUser, idTeam],
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Registo");
            res.json({
              mensagemStatus: "Atleta Criado!",
            });
          }
        }
      );
    }
  });
});

app.get("/atletas", (req, res) => {
  db.query(
    "SELECT Athlete.idAthlete, Athlete.NameAtl, User.Name , Athlete.Height, Athlete.Weight, Athlete.ArmSpan, Athlete.BirthDate,Team.NameT FROM Athlete INNER JOIN User ON Athlete.idUser = User.idUser INNER JOIN Team ON Athlete.idteam = Team.idTeam ",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        res.json(result);
      }
    }
  );
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

app.post("/deleteAtleta", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `Athlete` WHERE idAthlete=?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`Atleta de id: ${id} foi eliminado!`);
    }
  });
});

//---------------------------UserTreinador----------------------------------------
app.get("/getidtreinador", (req, res) => {
  db.query(
    "SELECT `idUser`, `Name` FROM `User` WHERE Tipo = 1",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        var dataCas = [];
        for (var i = 0; i < result.length; i++) {
          dataCas.push(
            JSON.parse(
              `{"value":${result[i].idUser}, "label": "${result[i].Name}"}`
            )
          );
        }
        console.log(dataCas);

        res.json(dataCas);
      }
    }
  );
});

app.post("/createUserTreinador", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const PhoneNumber = req.body.PhoneNumber;

  console.log(
    "name: " +
      name +
      " email: " +
      email +
      " pass: " +
      password +
      " " +
      PhoneNumber
  );

  db.query("SELECT * FROM User WHERE Email = ?", email, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    console.log(result);
    if (result.length == 0) {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.log(err);
        }
        db.query(
          "INSERT INTO `User`(`Name`, `Email`, `PassWord`, `PhoneNumber`, `Tipo`) VALUES (?,?,?,?,1)",
          [name, email, hash, PhoneNumber],
          (err, result) => {
            if (err) {
              console.log(err);
            }
            res.json({
              mensagemStatus: "Treinador Registado!",
            });
          }
        );
      });
    } else {
      res.json({
        mensagemStatus: "Já existe este Email!",
      });
    }
  });
});

app.get("/usersTreinador", (req, res) => {
  db.query("SELECT * FROM `User` WHERE Tipo = 1", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

//---------------------------Team----------------------------------------

app.get("/teams", (req, res) => {
  db.query(
    //SELECT Athlete.idAthlete, Athlete.NameAtl , Athlete.PhoneNumber , Athlete.Email, User.Name , Athlete.Height, Athlete.Weight, Athlete.ArmSpan, Athlete.BirthDate FROM Athlete INNER JOIN User ON Athlete.idUser = User.idUser
    "SELECT Team.idTeam, level.NameEs , Team.NameT, User.Name FROM Team INNER JOIN level ON Team.idEscalao_team = level.idEscalao INNER JOIN User ON Team.idtreinador = User.idUser",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    }
  );
});
app.get("/getidteams", (req, res) => {
  db.query("SELECT idTeam, NameT FROM `Team`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      var dataCas = [];
      for (var i = 0; i < result.length; i++) {
        dataCas.push(
          JSON.parse(
            `{"value":${result[i].idTeam}, "label": "${result[i].NameT}"}`
          )
        );
      }
      console.log(dataCas);

      res.json(dataCas);
    }
  });
});

app.post("/createTeam", (req, res) => {
  const idEscalao_team = req.body.idEscalao_team;
  const NameT = req.body.NameT;
  const idtreinador = req.body.idtreinador;

  db.query("SELECT * FROM `Team` WHERE NameT = ?", NameT, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    console.log(result);

    if (err) {
      console.log(err);
    }
    db.query(
      "INSERT INTO `Team`(`idEscalao_team`, `NameT`, `idtreinador`) VALUES (?,?,?)",
      [idEscalao_team, NameT, idtreinador],
      (err, result) => {
        if (err) {
          console.log(err);
        }
        res.json({
          mensagemStatus: "Equipa Registada!",
        });
      }
    );
  });
});
app.post("/deleteTeam", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `Team` WHERE idTeam =?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`Equipa de id: ${id} foi eliminada!`);
    }
  });
});

//---------------------------ESCALÃO----------------------------------------
app.get("/escalao", (req, res) => {
  db.query("SELECT * FROM `level`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.get("/getidEscalao", (req, res) => {
  db.query("SELECT `idEscalao`, `NameEs` FROM `level`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      var dataCas = [];
      for (var i = 0; i < result.length; i++) {
        dataCas.push(
          JSON.parse(
            `{"value":${result[i].idEscalao}, "label": "${result[i].NameEs}"}`
          )
        );
      }
      console.log(dataCas);

      res.json(dataCas);
    }
  });
});

app.post("/createEscalao", (req, res) => {
  const Descricao = req.body.Descricao;
  const NameEs = req.body.Name;

  db.query("SELECT * FROM `level` WHERE NameEs=?", Name, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    console.log(result);

    if (err) {
      console.log(err);
    }
    db.query(
      "INSERT INTO `level`( `NameEs`, `Descricao`) VALUES (?,?)",
      [NameEs, Descricao],
      (err, result) => {
        if (err) {
          console.log(err);
        }
        res.json({
          mensagemStatus: "Escalão Registado!",
        });
      }
    );
  });
});
app.post("/deleteEscalao", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `level` WHERE idEscalao =?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`Escalaode id: ${id} foi eliminado!`);
    }
  });
});
//---------------------------Event----------------------------------------
app.get("/event", (req, res) => {
  db.query("SELECT * FROM `Events`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/createEvent", (req, res) => {
  const ev_inicio = req.body.ev_inicio;
  const ev_fim = req.body.ev_fim;
  const idteam = req.body.idteam;
  const idestado = req.body.idestado;
  const local = req.body.local;

  db.query(
    "INSERT INTO `Events`( `ev_inicio`, `ev_fim`, `idteam`, `idestado`, `local`) VALUES (?,?,?,?,?)",
    [ev_inicio, ev_fim, idteam, idestado, local],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      res.json({
        mensagemStatus: "Evento Registado!",
      });
    }
  );
});
app.post("/deleteEvent", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `Events` WHERE idevents =?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`Evento de id: ${id} foi eliminado!`);
    }
  });
});
//---------------------------Exercicio----------------------------------------

app.get("/getidexe", (req, res) => {
  db.query("SELECT idExercise, Name FROM `Exercicio `", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      var dataCas = [];
      for (var i = 0; i < result.length; i++) {
        dataCas.push(
          JSON.parse(
            `{"value":${result[i].idExercise}, "label": "${result[i].Name}"}`
          )
        );
      }
      console.log(dataCas);

      res.json(dataCas);
    }
  });
});
app.get("/exercise", (req, res) => {
  db.query("SELECT * FROM `Exercicio`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/createExercise", (req, res) => {
  const Name = req.body.Name;
  const Descrição = req.body.Descrição;
  const ObjectivoEsp = req.body.ObjectivoEsp;
  const CriterioSucess = req.body.CriterioSucess;
  const Duration = req.body.Duration;
  const Esquema_link = req.body.Esquema_link;

  db.query("SELECT * FROM `Exercicio` WHERE Name=?", Name, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    console.log(result);

    if (err) {
      console.log(err);
    }
    db.query(
      "INSERT INTO `Exercicio`(`Name`, `Descrição`, `ObjectivoEsp`, `CriterioSucess`, `Duration`, `Esquema_link`) VALUES (?,?,?,?,?,?)",
      [Name, Descrição, ObjectivoEsp, CriterioSucess, Duration, Esquema_link],
      (err, result) => {
        if (err) {
          console.log(err);
        }
        res.json({
          mensagemStatus: "Exercicio Registado!",
        });
      }
    );
  });
});
app.post("/deleteExercise", (req, res) => {
  const id = req.body.id;

  db.query(
    "DELETE FROM `Exercicio` WHERE idExercise=?;",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(`Exercicio de id: ${id} foi eliminado!`);
      }
    }
  );
});
//---------------------------Gesto TEcnico----------------------------------------
app.get("/Gestoidn", (req, res) => {
  db.query("SELECT `idGesto`, `NomeGesto` FROM `Gesto`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      var dataCas = [];
      for (var i = 0; i < result.length; i++) {
        dataCas.push(
          JSON.parse(
            `{"value":${result[i].idGesto}, "label": "${result[i].NomeGesto}"}`
          )
        );
      }
      console.log(dataCas);

      res.json(dataCas);
    }
  });
});

app.get("/GestoTecnico", (req, res) => {
  db.query("SELECT * FROM `Gesto`", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/createGestoTecnico", (req, res) => {
  const NomeGesto = req.body.NomeGesto;
  const Descrição = req.body.Descrição;

  db.query(
    "SELECT * FROM `Gesto` WHERE NomeGesto=?",
    NomeGesto,
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }
      console.log(result);

      if (err) {
        console.log(err);
      }
      db.query(
        "INSERT INTO `Gesto`(`NomeGesto`, `Descrição`) VALUES (?,?) ",
        [NomeGesto, Descrição],
        (err, result) => {
          if (err) {
            console.log(err);
          }
          res.json({
            mensagemStatus: "Gesto Tecnico Registado!",
          });
        }
      );
    }
  );
});
app.post("/deleteGestoTecnico", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM `Gesto` WHERE idGesto=?;", [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(`GestoTecnico de id: ${id} foi eliminado!`);
    }
  });
});

//---------------------------Criterio ----------------------------------------
//SELECT Athlete.idAthlete, Athlete.NameAtl , Athlete.PhoneNumber , Athlete.Email, User.Name , Athlete.Height, Athlete.Weight, Athlete.ArmSpan, Athlete.BirthDate FROM Athlete INNER JOIN User ON Athlete.idUser = User.idUser

app.get("/Criterio", (req, res) => {
  db.query(
    "SELECT Criterio.idCriterio, Criterio.descricao, Gesto.NomeGesto FROM Criterio INNER JOIN Gesto ON Gesto.idGesto = Criterio.idGesto ",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result + "MASDASD");
        res.json(result);
      }
    }
  );
});

app.post("/createCriterio", (req, res) => {
  const Descrição = req.body.Descrição;
  const idGesto = req.body.idGesto;
  db.query(
    "SELECT * FROM `Criterio` WHERE descricao=?",
    Descrição,
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }
      console.log(result);

      if (err) {
        console.log(err);
      }
      db.query(
        "INSERT INTO `Criterio`(`descricao`, `idGesto`) VALUES (?,?)",
        [Descrição, idGesto],
        (err, result) => {
          if (err) {
            console.log(err);
          }

          res.json({
            mensagemStatus: "Criterio Registado!",
          });
        }
      );
    }
  );
});
app.post("/deleteCriterio", (req, res) => {
  const id = req.body.id;

  db.query(
    "DELETE FROM `Criterio` WHERE idCriterio=?;",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(`Criterio de id: ${id} foi eliminado!`);
      }
    }
  );
});

//--------------------------AVALIAÇÂO
app.get("/avaliacao", (req, res) => {
  db.query(
    "SELECT  Athlete_Evaluation.idAthlete_Evaluation, Athlete.NameAtl, Athlete_Evaluation.Score FROM Athlete_Evaluation INNER JOIN Athlete ON Athlete.idAthlete = Athlete_Evaluation.idAthlete ",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    }
  );
});
app.post("/deleteavaliacao", (req, res) => {
  const id = req.body.id;

  db.query(
    "DELETE FROM `Athlete_Evaluation` WHERE idAthlete_Evaluation=?;",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(`Avaliação de id: ${id} foi eliminado!`);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`runnig server! http://${hostname}:${port}/`);

  if (resultenv.error) {
    throw resultenv.error;
  }

  console.log(resultenv.parsed);
});
