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
const GoogleStrategy = require('passport-google-oauth20').Strategy
const path = require('path')
// const request = require('request')

require('dotenv').config()

const storage = multer.memoryStorage()
const upload = multer({storage : storage})

process.env.PATH += ';C:\\Users\\edwar\\Documents\\ffmpeg\\ffmpeg-7.0.2-full_build\\bin'

app.use(express.json())
var cors = require('cors')
app.use(express.static(path.join(__dirname, 'build')))
// const { console } = require('inspector')
app.use(cors({origin: 'http://localhost:8080', credentials: true}))
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const exUser = await db.collection('user').findOne({username : profile.displayName})

        if (exUser) {
            return done(null, exUser)
        } else {
            await db.collection('user').insertOne({
                username : profile.displayName,
                password : ''
            })

            let uid = await db.collection('user').findOne({username : profile.displayName})
            await db.collection('info').insertOne({
                user_id : uid._id,
                cycle : 0,
                a : 0,
                e : 0,
                i : 0,
                o : 0,
                u : 0,
                single_con : 0,
                double_con : 0
            })

            return done(null, uid)
        }
    } catch (err) {
        return done(err)
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/build/index.html'))
})

app.post('/login', async (req, res, next) => {
    passport.authenticate('local', (error, user, info) => {
        if (error) return res.status(500).json(error)
        if (!user) return res.status(403).json(info.message)
        req.logIn(user, (err) => {
            if (err) return next(err)
            res.status(200).json({ message: 'Logged in successfully' })
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
        let uid = await db.collection('user').findOne({username : req.body.username})
        await db.collection('info').insertOne({
            user_id : uid._id,
            cycle : 0,
            a : 0,
            e : 0,
            i : 0,
            o : 0,
            u : 0,
            single_con : 0,
            double_con : 0
        })
        res.status(200).json({ message: 'Registered successfully' })
    }
})

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/')
})

app.get('/check-auth', (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user) {
        res.json({loggedIn : true, user : req.session.passport.user})
    } else {
        res.json({loggedIn : false})
    }
})

app.get('/logout', (req, res, next) => {
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
                res.status(200).json({ message: 'Logged out successfully' })
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

    const requestJson2 = {
        'argument': {
            'language_code': code,
            'script': '',
            'audio': base64Encoded
        }
    }

    const options = {
        headers: {'Content-Type':'application/json', 'Authorization':accessKey}
    }

    let score = 0
    let recognized = ''

   
    const response2 = await axios.post(apiURL, requestJson2, options)
    let a = response2.data
    recognized = a.return_object.recognized

    const response = await axios.post(apiURL, requestJson, options)
    a = response.data
    score = a.return_object.score

    res.status(200).json({'score' : score, 'recognized' : recognized})
})

app.get('/words', async (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user){
        const uid = req.session.passport.user.id
        const info = await db.collection('info').findOne({user_id : new ObjectId(uid)})
        let b = true
        if (info.cycle < 10) {
            b = false
        }

        let result = []
        let nums = []
        if (b == false) {
            let t1 = await db2.collection('a').aggregate([
                {$sample : {size : 2}}
            ]).toArray()
            let t2 = await db2.collection('e').aggregate([
                {$sample : {size : 2}}
            ]).toArray()
            let t3 = await db2.collection('i').aggregate([
                {$sample : {size : 2}}
            ]).toArray()
            let t4 = await db2.collection('o').aggregate([
                {$sample : {size : 2}}
            ]).toArray()
            let t5 = await db2.collection('u').aggregate([
                {$sample : {size : 2}}
            ]).toArray()
            let t6 = await db2.collection('single_con').aggregate([
                {$sample : {size : 3}}
            ]).toArray()
            let t7 = await db2.collection('double_con').aggregate([
                {$sample : {size : 3}}
            ]).toArray()
            // let t8 = await db2.collection('sentence').aggregate([
            //     {$sample : {size : 1}}
            // ]).toArray()
            result = [...t1, ...t2, ...t3, ...t4, ...t5, ...t6, ...t7]
            nums = [2, 2, 2, 2, 2, 3, 3]
        } else {
            let t1 = []
            if (info.a < -10) {
                t1 = await db2.collection('a').aggregate([
                    {$sample : {size : 1}}
                ]).toArray()
                nums.push(1)
            } else if (info.a > 10) {
                t1 = await db2.collection('a').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            } else {
                t1 = await db2.collection('a').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            }
            let t2 = []
            if (info.e < -10) {
                t2 = await db2.collection('e').aggregate([
                    {$sample : {size : 1}}
                ]).toArray()
                nums.push(1)
            } else if (info.e > 10) {
                t2 = await db2.collection('e').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            } else {
                t2 = await db2.collection('e').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            }
            let t3 = []
            if (info.i < -10) {
                t3 = await db2.collection('i').aggregate([
                    {$sample : {size : 1}}
                ]).toArray()
                nums.push(1)
            } else if (info.i > 10) {
                t3 = await db2.collection('i').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            } else {
                t3 = await db2.collection('i').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            }
            let t4 = []
            if (info.o < -10) {
                t4 = await db2.collection('o').aggregate([
                    {$sample : {size : 1}}
                ]).toArray()
                nums.push(1)
            } else if (info.o > 10) {
                t4 = await db2.collection('o').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            } else {
                t4 = await db2.collection('o').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            }
            let t5 = []
            if (info.u < -10) {
                t5 = await db2.collection('u').aggregate([
                    {$sample : {size : 1}}
                ]).toArray()
                nums.push(1)
            } else if (info.u > 10) {
                t5 = await db2.collection('u').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            } else {
                t5 = await db2.collection('u').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            }
            let t6 = []
            if (info.single_con < -10) {
                t6 = await db2.collection('single_con').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            } else if (info.single_con > 10) {
                t6 = await db2.collection('single_con').aggregate([
                    {$sample : {size : 4}}
                ]).toArray()
                nums.push(4)
            } else {
                t6 = await db2.collection('single_con').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            }
            let t7 = []
            if (info.double_con < -10) {
                t7 = await db2.collection('double_con').aggregate([
                    {$sample : {size : 2}}
                ]).toArray()
                nums.push(2)
            } else if (info.double_con > 10) {
                t7 = await db2.collection('double_con').aggregate([
                    {$sample : {size : 4}}
                ]).toArray()
                nums.push(4)
            } else {
                t7 = await db2.collection('double_con').aggregate([
                    {$sample : {size : 3}}
                ]).toArray()
                nums.push(3)
            }
            // let t8 = await db2.collection('sentence').aggregate([
            //     {$sample : {size : 1}}
            // ]).toArray()
            // nums.push(1)

            result = [...t1, ...t2, ...t3, ...t4, ...t5, ...t6, ...t7]
        }

        res.status(200).json({words: result, nums: nums})
    } else {
        res.json({error : 'Not Logged In'})
    }
})

app.post('/result', async (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user){
        const uid = req.session.passport.user.id
        const info = await db.collection('info').findOne({user_id : new ObjectId(uid)})
        
        let in_cycle = info.cycle + 1
        let in_a = info.a
        let in_e = info.e
        let in_i = info.i
        let in_o = info.o
        let in_u = info.u
        let in_s = info.single_con
        let in_d = info.double_con

        const arr = [...req.body.scores]
        const nums = [...req.body.nums]

        let count = nums[0]
        let idx = count
        for (let i = 0; i < count; i++) {
            if (arr[i] < 2.5) {
                in_a = in_a + 1
            } else if (arr[i] >= 4) {
                in_a = in_a - 1
            }
        }
        count = count + nums[1]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_e = in_e + 1
            } else if (arr[i] >= 4) {
                in_e = in_e - 1
            }
        }
        idx = count
        count = count + nums[2]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_i = in_i + 1
            } else if (arr[i] >= 4) {
                in_i = in_i - 1
            }
        }
        idx = count
        count = count + nums[3]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_o = in_o + 1
            } else if (arr[i] >= 4) {
                in_o = in_o - 1
            }
        }
        idx = count
        count = count + nums[4]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_u = in_u + 1
            } else if (arr[i] >= 4) {
                in_u = in_u - 1
            }
        }
        idx = count
        count = count + nums[5]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_s = in_s + 1
            } else if (arr[i] >= 4) {
                in_s = in_s - 1
            }
        }
        idx = count
        count = count + nums[6]
        for (let i = idx; i < count; i++){
            if (arr[i] < 2.5) {
                in_d = in_d + 1
            } else if (arr[i] >= 4) {
                in_d = in_d - 1
            }
        }

        await db.collection('info').updateOne({user_id : new ObjectId(uid)}, 
            {$set : {cycle : in_cycle, a : in_a, e : in_e, i : in_i, o : in_o, u : in_u, single_con : in_s, double_con : in_d}})
        
        res.status(200).json({ message: 'Updated successfully' })
    } else {
        res.json({error : 'Not Logged In'})
    }
})

app.get('/statistics', async (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user){
        const uid = req.session.passport.user.id
        const info = await db.collection('info').findOne({user_id : new ObjectId(uid)})

        res.status(200).json({cycle : info.cycle, a : info.a, e : info.e, i : info.i, o : info.o, u : info.u, single_con : info.single_con, double_con : info.double_con})
    } else {
        res.json({error : 'Not Logged In'})
    } 
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/build/index.html'))
})