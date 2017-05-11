const uuidV1 = require('uuid/v1');
const fs = require('fs');
const dbData = JSON.parse(fs.readFileSync('db.json', 'utf8'));
const users = dbData.users;

const sessionTokenName = 'session-token';

var authorizedUsers = {};

function isValidUser(login, password) {
    var isValid = false;
    users.forEach(function(user) {
        if(user.login === login && user.password === password) {
            isValid = true;
        }
    });
    return isValid;
}

function checkLoginAuth(login, sessionToken) {
    const token = authorizedUsers[login];

    return !!token && token === sessionToken;
}

function checkTokenAuth(sessionToken){
    for(i in authorizedUsers){
        if(authorizedUsers.hasOwnProperty(i)) {
            var token = authorizedUsers[i];

            if(token === sessionToken) {
                return true;
            }
        }
    }
    return false;
}

function login(req, res, next) {
    const login = req.body.login;
    const password = req.body.password;
    const sessionToken = req.headers[sessionTokenName];

    if (checkLoginAuth(login, sessionToken)) {
        res.sendStatus(200);
        return;
    }

    if(!isValidUser(login, password)) {
        res.sendStatus(400);
        return;
    }

    const newSessionToken = uuidV1();
    authorizedUsers[login] = newSessionToken;
    res.set(sessionTokenName, newSessionToken);
    res.sendStatus(200);
}
function logout(req, res, next) {
    const login = req.body.login;
    const sessionToken = req.headers[sessionTokenName];

    if (!checkLoginAuth(login, sessionToken)) {
        res.sendStatus(400);
        return;
    }

    delete authorizedUsers[login];
    res.sendStatus(200);
}
function isAuthorized(req, res, next) {
    const sessionToken = req.headers[sessionTokenName];

    if (sessionToken && checkTokenAuth(sessionToken)) {
        next();
    } else {
        res.sendStatus(401);
    }
}

module.exports = {
    login: login,
    logout: logout,
    isAuthorized: isAuthorized
};