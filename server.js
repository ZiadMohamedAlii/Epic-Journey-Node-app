// this server file for setup the application
const mongoose = require('mongoose');
const dotenv = require('dotenv'); //ENV VARIABLE

process.on('uncaughtException', (err) => {
  // This handles the sync code errors

  console.log('UNCAUGHT EXCEPTION 💣 Shutting down ...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); // dotenv must be before app'express'
const app = require('./app'); //express app

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose // connect to Database
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection success...'));

const port = 3000;
const server = app.listen(port, () => {
  console.log(`app Running on ${port} ...`);
});

process.on('unhandledRejection', (err) => {
  // This handles the Async code promises errors

  console.log('UNHANDLED REJECTION 💣 Shutting down ...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
