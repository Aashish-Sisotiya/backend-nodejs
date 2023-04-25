import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// mongoose.connect("mongodb://127.0.0.1:27017",{
//   database:"backend"
// }).then(()=>console.log("Database connected"))
// .catch((err)=>console.log(err));

mongoose
  .connect("mongodb://127.0.0.1:27017/backend")
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", UserSchema);

const port = 3000;
const app = express();
//using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: "true" }));
app.use(cookieParser());

//middleware
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "fgdsgfdhgdhdhfdh"); // it returns payload

    // console.log(decoded);

    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};

app.set("view engine", "ejs"); // to render html using plain javascript

app.get("/", isAuthenticated, (req, res) => {
  //   const pathLocation = path.resolve();

  //   res.sendFile(path.join(pathLocation, "index.html"));
  // res.render("index", { name: "me" });
  //   res.sendFile("index");
  // console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", { email, message: "Incorrect Password" });
  }

  const token = jwt.sign({ _id: user._id }, "fgdsgfdhgdhdhfdh"); // it returns token

  res.cookie("token", token, {
    expires: new Date(Date.now() + 60 * 1000),
    httpOnly: true,
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  // console.log(req.body);
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({ name, email, password: hashedPassword });

  const token = jwt.sign({ _id: user._id }, "fgdsgfdhgdhdhfdh"); // it returns token
  // console.log(token);

  res.cookie("token", token, {
    expires: new Date(Date.now() + 60 * 1000),
    httpOnly: true,
  });
  res.redirect("/");
});

app.listen(port, () => {
  console.log("server is running on new  port " + port);
});
