const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const pageRouter = require('./routes/pages');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');

//app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/resources', express.static('public'));
app.use('/resources', express.static(path.join(__dirname, '/public')));

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app.engine('handlebars', exphbs());
app.set('view engine', 'ejs');
app.use(fileUpload());

app.use(session({
    secret: 'LuckyTattoo',
    resave: false,
	saveUninitialized: false,
	cookie: {
        maxAge: 60 * 1000 * 30
    }
}));


app.use('/', pageRouter);

app.use((req, res, next)=>{
	var err = new Error('Page not found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});


app.listen(app.get('port'), ()=>{
    console.log('SERVER RUNNING IN http://localhost:'+app.get('port'));
})

module.exports = app;