// Importing Libraies that we installed using npm
const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const passport = require("passport")
// const initializePassport = require("./passport-config")
const LocalStrategy = require("passport-local").Strategy
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")
const mongoose = require("mongoose")
const { name } = require("ejs")
const path = require('path')

function initialize(passport, getUserByEmail, getUserById){
    // Function to authenticate users
    const authenticateUsers = async (email, password, done) => {
        // Get users by email
        const user = await User.findOne({email: email});
        if (user == null){
            return done(null, false, {message: "No user found with that email"})
        }
        try {
            if(await bcrypt.compare(password, user.password)){
                console.log(user.name + " loged in");
                return done(null, user)
            } else{
                return done (null, false, {message: "Password Incorrect"})
            }
        } catch (e) {
            console.log(e);
            return done(e)
        }
    }
    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUsers))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser((id, done) => {
        return done(null,id)
    })
}

initialize(passport,email => user.email ,id => user._id)

const userSchema = new mongoose.Schema({
    name : {type: String , required: true},
    email :  {type: String , required: true},
    password : {type: String , required: true},
    date: {type: Date , default: Date.now}
})
const User = mongoose.model('User',userSchema);
async function createUser(name,email,password){
    const user = new User({
        name: name,
        email : email,
        password: password
    });
    const result = await user.save();
    console.log(result);
}

app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: 'mamad',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize()) 
app.use(passport.session())
app.use(methodOverride("_method"))
app.use(express.static('public'));

// Configuring the register post functionality
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

// Configuring the register post functionality
app.post("/register", checkNotAuthenticated, async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        createUser(req.body.name,req.body.email,hashedPassword);
        res.redirect("/login")
    } catch (e) {
        console.log(e);
        res.redirect("/register")
    }
})

// Routes
app.get('/', checkAuthenticated, async (req, res) => {
    const name = await getUserName(req.session.passport.user);
    res.render("homepage.ejs", {name: name , imageUrl: '/images/homepage2.jpg' })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})
// End Routes

app.delete("/logout", async(req, res) => { 
    const name = await getUserName(req.session.passport.user);
    req.logout(req.user, async err => {
        if (err){
            console.log(err);
            return next(err)
        }
        console.log(name + ' loged out')
        res.redirect("/")
    })
})

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    next()
}
async function getUserName(id){
    const user = await User.findOne({_id: id}); 
    return user.name; 
}
app.listen(3000 , () =>{
    mongoose.connect('mongodb://127.0.0.1:27017/Edge_MLOps',{
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(db => console.log('connected to db')).catch(err => console.log(err))
})