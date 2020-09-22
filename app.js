const url = require('url');

const ws = require('ws');

const Cookies = require('cookies');

const Koa = require('koa');

const bodyParser = require('koa-bodyparser');

const controller = require('./controller');

const templating = require('./templating');

const path = require('path');

const WebSocketServer = ws.Server;

const app = new Koa();

// log request URL:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// parse user from cookie:
app.use(async (ctx, next) => {
    ctx.state.user = parseUser(ctx.cookies.get('name') || '');
    await next();
});

// static file support:
let staticFiles = require('./static-files');
app.use(staticFiles('/static/', __dirname + '/static'));

// parse request body:
app.use(bodyParser());

// add nunjucks as view:
app.use(templating(path.resolve(__dirname, 'views'), {
    noCache: true,
    watch: true
}));

// add controller middleware:
app.use(controller());

let server = app.listen(30001);

//identify user
function parseUser(obj) {
    if (!obj) {
        return;
    }
    console.log('try parse: ' + obj);
    let s = '';
    if (typeof obj === 'string') {
        s = obj;
    } else if (obj.headers) {
        let cookies = new Cookies(obj, null);
        s = cookies.get('name');
    }
    if (s) {
        try {
            let user = JSON.parse(Buffer.from(s, 'base64').toString());
            console.log(`User: ${user.name}, ID: ${user.id}`);
            return user;
        } catch (e) {
            console.log(e)
        }
    }
}

function createWebSocketServer(server, onConnection, onMessage, onClose, onError) {
    let wss = new WebSocketServer({
        server: server
    });
    // wss.broadcast = function broadcast(data) {
    //     wss.clients.forEach(function each(client) {
    //         client.send(data);
    //     });
    // };
    wss.broadcast = function broadcast(data) {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(data)
        }
      });
    }
    console.log(wss.clients.length)
    onConnection = onConnection || function () {
        console.log('[WebSocket] connected.');
    };
    onMessage = onMessage || function (msg) {
        console.log('[WebSocket] message received: ' + msg);
    };
    onClose = onClose || function (code, message) {
        console.log(`[WebSocket] closed: ${code} - ${message}`);
    };
    onError = onError || function (err) {
        console.log('[WebSocket] error: ' + err);
    };
    wss.on('connection',  function (ws,req) {
        ws.upgradeReq = req
        let location = url.parse(ws.upgradeReq.url, true);
        console.log('[WebSocketServer] connection: ' + location.href);
        ws.on('message', onMessage);
        ws.on('close', onClose);
        ws.on('error', onError);
        if (location.pathname !== '/ws/chat') {
            // close 
           ws.close(4000, 'Invalid URL')
           return
        }
        // check user:
        let user = parseUser(ws.upgradeReq);
        console.log(user)
        if (!user) {
            ws.close(4001, 'Invalid user');
        }
        ws.user = user;
        ws.wss = wss;
        console.log(wss.clients)
        onConnection.apply(ws);
        console.log('last demo')
        console.log(wss.clients[wss.clients.length-1] === ws)
        console.log(ws.readyState,ws.OPEN)  
    });
    console.log('WebSocketServer was attached.');
    return wss;
}

var messageIndex = 0;

function createMessage(type, user, data) {
    messageIndex ++;
    return JSON.stringify({
        id: messageIndex,
        type: type,
        user: user,
        data: data
    });
}

function onConnect() {
    let user = this.user;
    if (!user) {
      return
    }
    let msg = createMessage('join', user, `${user.name} joined.`);
    this.wss.broadcast(msg);
    //build user list:
    let users = [] ;
    this.wss.clients.forEach(function (client) {
        return users.push(client.user)
    });
    console.log(users)
    // let index = this.wss.clients.( (e) => e.id === user.id)
    // console.log(index)
    // if (index !== -1) {
    //   this.wss.clients[index].close(4004, 'User Exist')
    // }
    //close repeat client
    this.wss.clients.forEach( (client) => {
        if (client.id === user.id) {
            client.close(4004,'User Exist')
        }
    })
    this.id = user.id
    this.send(createMessage('list', user, users));
}

function onMessage(message) {
    console.log(message);
    if (message && message.trim()) {
        let msg = createMessage('chat', this.user, message.trim());
        this.wss.broadcast(msg);
    }
}

function onClose() {
    let user = this.user;
    if (!user) {
      return
    }
    let msg = createMessage('left', user, `${user.name} is left.`);
    this.wss.broadcast(msg);
}

app.wss = createWebSocketServer(server, onConnect, onMessage, onClose);

console.log('app started at port 30001...');
