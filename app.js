const express = require('express')
const app = express();
const PORT = process.env.PORT || 8000
const cors = require('cors')
const mongoose = require('mongoose');
const userSchema = require('./Models/UserModel');
const { validateUser } = require('./Utils/Validator');
const bcrypt = require('bcrypt');
const UserSchema = require('./Models/UserModel');
const saltRounds = 12;
const session = require('express-session');
const { Auth } = require('./Middlewares/Auth');
const TodoModel = require('./Models/TodoModel');
const { AccessTimeLimit } = require('./Middlewares/AccessTimeLimit');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGO_URI = 'mongodb+srv://krunalsolucky121:idkmypass@cluster0.fnwuteo.mongodb.net';

mongoose.connect(MONGO_URI)
.then(() => console.log('connected to atlas'))
.catch((error) => console.log(error))

// session 
const store = new MongoDBStore({
    uri: MONGO_URI,
    collection: 'session'
});

app.use(session({
    secret: 'doing some shit',
    resave: false,
    saveUninitialized: false,
    store: store  
}));


app.use(cors())
app.use(express.json())

app.post('/register', async (req, res) => {
    const {name, email, password, mobile } = req.body;
    
    try {
        await validateUser ({ name, email, password, mobile });
      } catch (error) {
        return res.status(400).json({
          message: error, 
          status: 400,
        });
      }
      

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new userSchema({
        name : name,
        email : email,
        password : hashedPassword,
        mobile : mobile,
    })

    try { 
        let dummyUser = await userSchema.findOne({email : email});
        if(dummyUser) {
            return res.send({
                status: 400,
                message : 'User Already exists !'
            })
        }
        const dbData = await user.save();
        res.send({
            status : 200,
            message : "user created successfully",
            data : dbData
        })
    } catch (error) {
        console.log(error);
        res.send(error)
    }
})


app.get('/home', Auth, (req, res) => {
    return res.send(`<h1>This is Home</h1>`);
})

app.get('/logout', Auth, (req, res) => {
    req.session.destroy();
    return res.redirect('/login');
})

app.post('/create-todo', Auth, (req, res) => {
    const {title} = req.body;
    const todo = new TodoModel({
        title : title,
        email : req.session.user.email
    })

    try {
        todo.save();
        return res.send({
            message : "Todo added"
        })
    } catch (error) {
        return res.send( {
            message : error
        })
    }
})

app.get('/logout-all', Auth, async (req, res) => {
    console.log(req.session);
    const Schema = mongoose.Schema;
    const sessionSchema = new Schema({
        _id : String},
        {strict : false}
    )
    const SessionModel = mongoose.model("session", sessionSchema);

    try {
        const sessionDb = await SessionModel.deleteMany({'session.user.email' : req.session.user.email});
        return res.send({
            message : "Successfully logged out from all devices",
            status : 200
        })
    } catch (error){ 
        return res.send({
            message : "Error occured in logging out from all devices",
            status : 400
        })
    }
})

app.post('/edit-todo', Auth, async (req, res) => {
    const {id, newTodo} = req.body;
    
    let todo;
    try {
        todo = await TodoModel.findById(id);
    } catch (error) {
        return res.send({
            message : error
        }) 
    }

    if(!todo) res.send({
        status : 400,
        message : "no todo found"
    })

    try {
        await TodoModel.findByIdAndUpdate(id, {title : newTodo.title});
    } catch (error) {
        return res.send({
            message : 'database error',
            status : 500
        })
    }

    return res.status(200).send({
        message : "todo updated"
    })
})


app.delete('/delete-todo', Auth, async (req, res) => {
    const {id} = req.body;

    try {
        TodoModel.findByIdAndDelete(id);
    } catch (error) {
        return res.send({
            message : 'database error',
            error : error,
        })
    }

    return res.send({
        message : 'todo deleted successfully'
    })
})

app.get('/get-todos', Auth, AccessTimeLimit, async (req, res) => {
    const email = req.session.user.email;

    let todoList;
    try {
        todoList = await TodoModel.find({email : email});
    } catch (error) {
        return res.status(400).send ({
            message :'bad request'
        })
    }

    return res.send({
        message : 'successfully retrieved',
        data : todoList
    })
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    let dummyUser;
    try {
        dummyUser = await UserSchema.findOne({email : email});
        if(!dummyUser) return res.send('please register to login');
    } catch (error) {
        return res.status(400).send({
            message : error,
        })
    }

    try {
        let result = await bcrypt.compare(password, dummyUser.password);
        if(!result) {
            return res.status(401).send({
                message : 'Invalid Credentials',
            })
        }
    } catch (error) {
        return res.send({
            message : error,
        })
    }

    req.session.isAuth = true;
    req.session.user = {
        email : dummyUser.email,
        name : dummyUser.name,
        id : dummyUser._id
    }

    return res.status(200).send({
        message : 'successfully credentials'
    })
 })


 app.get('/pagination', Auth, async (req, res) => {
    let email = req.session.user.email;
    let limit = 2;
    let skip = (Number)(req.query.skip || 0);
    let todoList;
    try {
        todoList = await TodoModel.aggregate([
            {$match : {email : email}},
            {$facet : {
                data : [{$skip : skip}, {$limit : limit}]
            }}
        ])
    } catch (error) {
        return res.status(400).send({
            message : 'database error',
            error : error
        })
    }

    return res.send({
        message : 'data retrieved successfully',
        data : todoList
    })
 })


app.listen(PORT, ()=> {
    console.log(`fine ${PORT}`);
})