/*
gets database username form the computer's environment settings
all the process.env gets the value of the envrionement variable
*/

require("dotenv").config(); /* reads my settings in the .env file for the js program*/
const {Pool}= require("pg");
const db=new Pool({
    host: process.env.DB_HOST,
    port:Number(process.env.DB_PORT||5432),
    user:process.env.DB_USER,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
});
module.exports=db;




