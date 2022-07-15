const PORT = process.env.PORT || 8000
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
var bodyParser = require('body-parser')

const express = require('express')
const session = require('express-session')
const MongoDBSession = require('connect-mongodb-session')(session)
const path = require('path')
const UserModel = require('./models/User')

const app = express()

const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: true })

const mongoURI = 'mongodb://localhost:27017/tutorial'

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then((res) => {
        console.log('connected to database')
    })

const store = new MongoDBSession({
    uri: mongoURI,
    collection: "mySessions"
})

const staticPath = path.join(__dirname, 'public')

app.use(session({
    secret: 'key that will sign',
    resave: false,
    saveUninitialized: false,
    store: store
}))

const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        next()
    } else {
        res.redirect('login')
    }
}

app.use(express.static(staticPath))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', urlencodedParser, async (req, res) => {
    const { email, password } = req.body

    const user = await UserModel.findOne({email})

    if(!user) {
        return res.redirect('/login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        return res.redirect('/login')
    }

    req.session.isAuth = true
    res.redirect('/dashboard')
})

app.get('/register', (req, res) => {
    res.render('/register')
})

app.post('/register', urlencodedParser, async (req, res) => {
    const { username, email, password } = req.body

    let user = await UserModel.findOne({email})

    if(user) {
        return res.redirect('/register')
    }

    const hashedPsw = await bcrypt.hash(password, 12)

    user = new UserModel({
        username,
        email,
        password: hashedPsw
    })

    await user.save()

    res.redirect('/login')
})

app.get('/dashboard', isAuth, (req, res) => {
    res.render('/dashboard')
})

app.listen(PORT, console.log(`app running on port:${PORT}`))
