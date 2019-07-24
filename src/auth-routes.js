const uuidV1 = require('uuid/v1');
const fs = require('fs');
const dbData = JSON.parse(fs.readFileSync(__dirname + '/db.json', 'utf8'));
const users = dbData.users;

const sessionTokenName = 'session-token';

var authorizedUsers = {};

function getUser(login) {
    return users.find(user => user.login === login);
}

function isValidUser(user, password) {
    return user && user.password === password;
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
    const user = getUser(login);

    if(!isValidUser(user, password)) {
        res.sendStatus(400);
        return;
    }

    const newSessionToken = uuidV1();
    authorizedUsers[login] = newSessionToken;
    res.send({
        userName: login,
        roleId: user.roleId,
        sessionToken: newSessionToken,
    });
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