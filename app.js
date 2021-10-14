const express =require('express');
const cookieParser =require('cookie-parser');
const cors = require('cors');

const path = require('path')
const app=express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// Setting up config file 
if (process.env.NODE_ENV !== 'PRODUCTION') require('dotenv').config({ path: 'backend/config/config.env' })
// dotenv.config({ path: 'backend/config/config.env' })


const errorMiddleware= require('./middlewares/errors');

app.use(cookieParser())
app.use(cors());

//import routes
const produitRouter= require('./routes/produitRouter');
const markRouter= require('./routes/markRouter');
const userRouter= require('./routes/userRouter');
const CommandeRouter= require('./routes/commandeRouter');
app.use(express.static('backend/uploads'));



app.use('/api/v1/produit',produitRouter);
app.use('/api/v1/mark',markRouter); 
app.use('/api/v1/user',userRouter); 
app.use('/api/v1/commande',CommandeRouter); 

if (process.env.NODE_ENV === 'PRODUCTION') {
    app.use(express.static(path.join(__dirname, 'build')))

    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'build/index.html'))
    })
}

app.use(errorMiddleware);


module.exports=app