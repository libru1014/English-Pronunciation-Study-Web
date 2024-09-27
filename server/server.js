const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const MongoStore = require('connect-mongo')
const multer = require('multer')
const ffmpeg = require('fluent-ffmpeg')
const { PassThrough } = require('stream')
const axios = require('axios')
const request = require('request')

require('dotenv').config()

const storage = multer.memoryStorage()
const upload = multer({storage : storage})

app.use(express.json())
var cors = require('cors')
app.use(cors({origin: 'http://localhost:3000', credentials: true}))
app.use(express.urlencoded({extended : true}))
app.use(passport.initialize())
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    cookie : {
        maxAge : 60 * 60 * 1000,
        secure : false,
        httpOnly : false
    },
    store : MongoStore.create({
        mongoUrl : process.env.DB_URL,
        dbName : 'forum'
    })
}))

app.use(passport.session())

passport.use(new LocalStrategy(async (id, password, cb) => {
    let result = await db.collection('user').findOne({username : id})
    if (!result){
        return cb(null, false, {message : '아이디가 존재하지 않습니다.'})
    }
    if (await bcrypt.compare(password, result.password)){
        return cb(null, result)
    } else {
        return cb(null, false, {message : '비밀번호가 일치하지 않습니다.'})
    }
}))

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, {id : user._id, username : user.username})
    })
})

passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
        return done(null, result)
    })
})

let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client) => {
    console.log('DB connect success')
    db = client.db('forum')
    db2 = client.db('words')

    app.listen(8080, () => {
        console.log('http://localhost:8080 에서 서버 실행 중')
    })
}).catch((err) => {
    console.log(err)
})

app.post('/login', async (req, res, next) => {
    passport.authenticate('local', (error, user, info) => {
        if (error) return res.status(500).json(error)
        if (!user) return res.status(401).json(info.message)
        req.logIn(user, (err) => {
            if (err) return next(err)
            console.log("success")
            console.log(req.session)
            // res.redirect('/')

            return res.status(200).json({ message: 'Login successful', user: user })
        })
    })(req, res, next)
})

app.post('/register', async (req, res) => {
    console.log("register request")
    let result = await db.collection('user').findOne({username : req.body.username})

    if(result){
        return res.json({status : 0})
    } else {
        let hash = await bcrypt.hash(req.body.password, 10)
        await db.collection('user').insertOne({
            username : req.body.username,
            password : hash
        })
        // res.redirect('/')
        console.log("success")
    }
})

app.get('/check-auth', (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user) {
        res.json({loggedIn : true, user : req.session.passport.user})
    } else {
        res.json({loggedIn : false})
    }
})

app.get('/logout', (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user) {
        req.logout((err) => {
            if (err) {
                return next(err)
            }
            req.session.destroy((err) => {
                if (err) {
                    return next(err)
                }
                res.clearCookie('connect.sid')
            });
        })
    } else {
        res.json({error : 'Not Logged In'})
    }
})

const convert16kHz = (buffer) => {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough()
        inputStream.end(buffer)

        const outputStream = new PassThrough()
        ffmpeg(inputStream)
          .audioFrequency(16000)
          .format("wav")
          .on('end', () => {
            resolve(outputStream)
          })
          .on('error', (err) => {
            reject(err)
          })
          .pipe(outputStream, {end : true})
    })
}

const streamToBase64 = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = []
        stream.on('data', (chunk) => {
            chunks.push(chunk)
        })
        stream.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const base64String = buffer.toString('base64')
            resolve(base64String)
        })
        stream.on("error", (err) => {
            reject(err)
        })
    })
}

app.post('/test', upload.single('file'), async (req, res) => {
    const apiURL = 'http://aiopen.etri.re.kr:8000/WiseASR/Pronunciation'
    const accessKey = process.env.ACCESS_KEY
    const code = 'english'
    const script = req.body.word
    
    try {
        const buf = req.file.buffer

        const downsampled = await convert16kHz(buf)

        const base64Encoded = await streamToBase64(downsampled)

        const requestJson = {
            'argument': {
                'language_code': code,
                'script': script,
                'audio': base64Encoded
            }
        }

        const options = {
            url: apiURL,
            body: JSON.stringify(requestJson),
            headers: {'Content-Type':'application/json', 'Authorization':accessKey}
        }

        let score = 0
        
        request.post(options, function (error, response, body) {
            a = JSON.parse(body)
            score = a.return_object.score
            res.status(200).json({'score' : score})
        })
    } catch (error) {
        console.log('error')
    }
})

app.get('/words', async (req, res) => {
    const result = await db2.collection('vowel').aggregate([
        {$sample : {size : 10}},
    ]).toArray()
    res.status(200).json({words: result})
})