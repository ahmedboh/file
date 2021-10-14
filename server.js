const app =require('./app');
// const dotenv=require('dotenv');
const connectDataBase= require('./config/database');

// Setting up config file
if (process.env.NODE_ENV === 'PRODUCTION') require('dotenv').config({ path: 'backend/config/config.env' })

connectDataBase();
app.listen(process.env.PORT,()=>{
    console.log('server started on PORT:'+process.env.PORT+' in '+process.env.NODE_ENV+' mode .')
})