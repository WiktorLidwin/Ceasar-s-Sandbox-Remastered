const e = require('express')
const {
    Template
} = require('webpack')

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server)

app.use('/', express.static(__dirname + '/public'))
app.use('/game/:room', express.static(__dirname + '/public/game'))
//server.listen(3000)
server.listen(process.env.PORT)
console.log('Listening on 3000')

var serverTickRate = 64;

function findMode(name) {
    for (let i = 0; i < GameModes.length; i++) {
        if (GameModes[i].name == name) {
            return i;
        }
    }
    return -1;
}

function findTroops(names) {
    let temp = [];
    for (let i = 0; i < Troops.length; i++) {
        temp.push(Troops[i].name)
    }

    let troopIndexes = [];
    for (let i = 0; i < names.length; i++) {
        troopIndexes.push(temp.indexOf(names[i]))
    }
    return troopIndexes;
}

function findTroop(name) {
    let temp = [];
    for (let i = 0; i < Troops.length; i++) {
        temp.push(Troops[i].name)
    }

    return temp.indexOf(name);
}



Troops = []

var Troop = function () {}

function addTroops(name, damage, speed, hp, range, projectileSpeed, cost, size, attackSpeed, unitCollision, projectileCollision, projectileSize) {
    troop = new Troop()
    troop.name = name
    troop.damage = damage
    troop.speed = speed
    troop.hp = hp
    troop.range = range
    troop.projectileSpeed = projectileSpeed
    troop.cost = cost
    troop.size = size
    troop.attackSpeed = attackSpeed
    troop.unitCollision = unitCollision
    troop.projectileCollision = projectileCollision
    troop.projectileSize = projectileSize;
    Troops.push(troop)
}


var Projectile = function () {}

function addProjectile(x, y, enemyid, speed, size, damage, name, OriginP, roomid, id) {
    room = Rooms[findRoom(roomid)]
    projectile = new Projectile();
    projectile.x = x;
    projectile.y = y;
    projectile.enemyid = enemyid
    projectile.speed = speed;
    projectile.size = size;
    projectile.damage = damage;
    projectile.name = name;
    projectile.OriginP = OriginP;
    projectile.id = id;
    room.Projectiles.push(projectile);
}

//Collisions: array of rectangles/circles 
//0 = circle, centerx,centery, radius
//1 = rectangle, originx, originy, dx,dy

//TODO fix collison math
var meleeSize = 3;
var meleeProjectileSize = 1;
addTroops('Melee', 75, 3, 150, 8, 8, 100, meleeSize, 1,
    [0, meleeSize / 2, meleeSize / 2, meleeSize / 2],
    [0, meleeProjectileSize / 2, meleeProjectileSize / 2, meleeProjectileSize / 2],
    meleeProjectileSize)
var archerSize = 2;
var archerProjectileSize = 1;
addTroops('Archer', 100, 2, 100, 20, 8, 150, archerSize, .50,
    [1, 0, archerSize / 2, archerSize, archerSize][1, archerSize / 4, 0, archerSize / 4 * 3, archerSize / 2],
    [0, archerProjectileSize / 2, archerProjectileSize / 2, archerProjectileSize / 2],
    archerProjectileSize
)

var tankSize = 4;
var tankProjectileSize = 1;
addTroops('Tank', 150, 1, 250, 9, 8, 200, tankSize, 3,
    [1, 0, 0, tankSize, tankSize],
    [0, tankProjectileSize / 2, tankProjectileSize / 2, tankProjectileSize / 2],
    tankProjectileSize
)

GameModes = []

var Mode = function () {}

function addModes(money, time, troops, name) {
    mode = new Mode();
    mode.money = money;
    mode.time = time;

    troopIndexes = findTroops(troops);
    mode.troops = [];
    for (let i = 0; i < troopIndexes.length; i++) {
        mode.troops.push(Troops[troopIndexes[i]]);
    }
    mode.name = name;
    GameModes.push(mode)
}

let gameTroops = ["Melee", "Tank", "Archer"]
addModes(1000, 1000, gameTroops, "default"); //GameModes add


Users = []

var User = function () {
    this.name = null
    this.id = null
    this.roomid = null
    this.playing = false
    this.specating = false
}

Rooms = []

var Room = function () {
    this.id = null
    this.type = null
    this.maxPlayers = 2
    this.players = []
    this.spectators = []
    this.gameState = 0
    this.private = false
    this.justCreated = true
    this.troops = null;
    this.gameLoop = null;
    this.Projectiles = [];
    this.projectile_id = 0;
    this.troop_id = 0;
    this.roomMessages = [];
}

var Player = function () {
    this.id = null
    this.troops = null //TODO
    this.name = "";
    this.ready = false;
}

function findUser(id) {
    for (let i = 0; i < Users.length; i++) {
        if (Users[i].id == id) {
            return i
        }
    }
    return -1
}

function findRoom(roomid) {
    for (let i = 0; i < Rooms.length; i++) {
        if (Rooms[i].id == roomid) {
            return i
        }
    }
    return -1
}

function createRoomName() {
    var result = ''
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function createRoom() {
    roomid = createRoomName()
    while (findRoom(roomid) !== -1) {
        roomid = createRoomName()
    }
    var room = new Room()
    room.id = roomid
    Rooms.push(room)
    return roomid
}



function SendRoomInfo(socket) {
    room = Rooms[findRoom(socket.roomid)]
    let playerReadyCount = 0;
    for (let i = 0; i < room.players.length; i++) {
        if (room.players[i].ready)
            playerReadyCount++;
    }
    for (let i = 0; i < room.players.length; i++) {

        io.to(room.players[i].id).emit("requestRoomInfo",
            true,
            room.players,
            room.spectators.length,
            playerReadyCount,
            room.maxPlayers,
            room.gameState)
    }
    for (let i = 0; i < room.spectators.length; i++) {
        io.to(room.spectators[i]).emit("requestRoomInfo",
            false,
            room.players,
            room.spectators.length,
            playerReadyCount,
            room.maxPlayers,
            room.gameState)
    }
}

function createGame(troops, type, roomid) {
    room = Rooms[findRoom(roomid)];
    console.log(findRoom(roomid))
    if (type == "default") {
        //TODO ******** fix for more epeopl

        for (let i = 0; i < troops[0].length; i++) {
            troops[0][i].x = troops[0][i].x * 51 / 100;
            troops[0][i].id = room.troop_id;
            room.troop_id++;
        }
        for (let i = 0; i < troops[1].length; i++) {
            troops[1][i].x = (1 - troops[1][i].x * 51 / 100);
            troops[1][i].id = room.troop_id;
            room.troop_id++;
        }
        room.troops = troops;
        // console.log(room.troops[0][0].x,room.troops[0][0].y)
        // console.log(room.troops[0][0].x + Troops[findTroop(room.troops[0][0].name)].size/200, room.troops[0][0].y + Troops[findTroop(room.troops[0][0].name)].size/200)
        //console.log(Troops["Melee"].size / 200, Troops["Archer"].size / 200, Troops["Tank"].size / 200, )


        room.gameLoop = setInterval(() => updateGame(roomid), 1000 / serverTickRate);
    }
    console.log(troops);
}

function rectRectDistance(ax, ay, aw, ah, bx, by, bw, bh) {
    let xPos = findxPosOfRect(ax, aw, bx, bw);
    let yPos = findyPosOfRect(ay, ah, by, bh);
    if (xPos == 0 && yPos == 0) {
        return distiance(bx + bw, by + bh, ax, ay)
    }
    if (xPos == 0 && yPos == 1) {
        return distiance(bx + bw, by + bh / 2, ax, ay + ah / 2)
    }
    if (xPos == 0 && yPos == 2) {
        return distiance(bx + bw, by, ax, ay + ah)
    }
    if (xPos == 1 && yPos == 0) {
        return distiance(ax + aw / 2, ay, bx + bw / 2, by + bh)
    }
    if (xPos == 1 && yPos == 2) {
        return distiance(ax + aw / 2, ay + ah, bx + bw / 2, by)
    }
    if (xPos == 2 && yPos == 0) {
        return distiance(ax + aw, ay, bx, by + bh)
    }
    if (xPos == 2 && yPos == 1) {
        return distiance(ax + aw, ay + ah / 2, bx, by + bh / 2)
    }
    if (xPos == 2 && yPos == 2) {
        return distiance(ax + aw, ay + ah, bx, by)
    } else {
        //inside?
        return 0;
    }
}

function findxPosOfRect(ax, aw, bx, bw) {
    if (bx + bw < ax) {
        return 0; // left side
    } else if (ax + aw < bx) {
        return 2; // right side
    } else {
        return 1; //middle
    }
}

function findyPosOfRect(ay, ah, by, bh) {
    if (by + bh < ay) {
        return 0; // top side
    } else if (ay + ah < by) {
        return 2; // bot side
    } else {
        return 1; //middle
    }
}

function distiance(x, y, dx, dy) {
    return Math.sqrt((x - dx) * (x - dx) + (y - dy) * (y - dy))
}

function collisonCheck(ax, ay, aCollision, bx, by, bCollision) {
    // :(
    // :(
    // :(
    // :(
    // :(
    // :(
    // :(
    // :(
}

function deleteProjectilesAimingAtEnemy(enemyid, index, roomid) {
    room = Rooms[findRoom(roomid)];
    let temp = 0;
    for (let i = 0; i < room.Projectiles.length; i++) {
        if (room.Projectiles[i].enemyid == enemyid && room.Projectiles[i].enemyid == enemyid) {
            if (index <= i)
                temp++;
            console.log("removed bullets")
            room.Projectiles.splice(i, 1)
            i--;
        }
    }
    return temp;
}

function updateGame(roomid) {
    room = Rooms[findRoom(roomid)];
    if (room == undefined) {
        //clearInterval(room.gameLoop);//room deleted

    } else {
        //update game?
        playersDead = 0;

        for (let i = 0; i < room.troops.length; i++) {
            if (room.troops[i].length == 0)
                playersDead++;
        }
        if (playersDead == room.maxPlayers - 1) {
            //Game is done
            console.log("Done!")
            clearInterval(room.gameLoop)
            let winner = 0;
            for (let i = 0; i < room.troops.length; i++) {
                if (room.troops[i].length != 0)
                    winner = i;
            }
            io.in(roomid).emit("gameFinished", winner)
            //TODO end game loop 
        } else {
            for (let i = 0; i < room.troops.length; i++) {
                for (let z = 0; z < room.troops[i].length; z++) {
                    closestTroop = findClosestEnemy(i, z, roomid);
                    room.troops[closestTroop.player][closestTroop.troopIndex].highlight = true;
                    x = room.troops[i][z].x - Troops[findTroop(room.troops[i][z].name)].size / 200;
                    y = room.troops[i][z].y - Troops[findTroop(room.troops[i][z].name)].size / 200;
                    cx = room.troops[closestTroop.player][closestTroop.troopIndex].x - Troops[findTroop(room.troops[closestTroop.player][closestTroop.troopIndex].name)].size / 200;
                    cy = room.troops[closestTroop.player][closestTroop.troopIndex].y - Troops[findTroop(room.troops[closestTroop.player][closestTroop.troopIndex].name)].size / 200;
                    distanceFromEnemy = distiance(x, y, cx, cy);
                    if (distanceFromEnemy < Troops[findTroop(room.troops[i][z].name)].range / 100) {
                        var currentTime = new Date().getTime();
                        if (room.troops[i][z].pastAttackTime + 1000 * Troops[findTroop(room.troops[i][z].name)].attackSpeed < currentTime) {
                            //console.log(room.troops[i][z].pastAttackTime- currentTime)
                            room.troops[i][z].pastAttackTime = currentTime;
                            shotProjectile(i, z, room.troops[closestTroop.player][closestTroop.troopIndex].id, roomid);
                        }

                        //shot

                    } else {

                        var tx = cx - x,
                            ty = cy - y,
                            dist = Math.sqrt(tx * tx + ty * ty)

                        let velX = (tx / dist) * Troops[findTroop(room.troops[i][z].name)].speed / 5000;
                        let velY = (ty / dist) * Troops[findTroop(room.troops[i][z].name)].speed / 5000;
                        room.troops[i][z].x += velX
                        room.troops[i][z].y += velY

                        //move towards target 
                    }
                }
            }
            for (let i = 0; i < room.Projectiles.length; i++) {
                if (room.Projectiles[i] != undefined) {
                    var enemyTroop = findTroopWithId(room.Projectiles[i].enemyid, roomid);
                    if (enemyTroop != null) {
                        Tx = room.troops[enemyTroop.player][enemyTroop.troopIndex].x - Troops[findTroop(room.troops[enemyTroop.player][enemyTroop.troopIndex].name)].size / 200;
                        Ty = room.troops[enemyTroop.player][enemyTroop.troopIndex].y - Troops[findTroop(room.troops[enemyTroop.player][enemyTroop.troopIndex].name)].size / 200;
                        let tx = Tx - room.Projectiles[i].x,
                            ty = Ty - room.Projectiles[i].y,
                            dist = Math.sqrt(tx * tx + ty * ty)
                        // if(Projectiles[i].OriginP == 1){
                        //     console.log(Projectiles[i].x, Projectiles[i].y, Tx,Ty, dist);
                        // }  
                        if (Math.abs(tx) < .005 && Math.abs(ty) < .005) { //Projectile hit
                            console.log("deleted")
                            room.troops[enemyTroop.player][enemyTroop.troopIndex].hp -= room.Projectiles[i].damage;
                            //Problem 2 troops aiming at same person

                            if (room.troops[enemyTroop.player][enemyTroop.troopIndex].hp <= 0) {
                                room.troops[enemyTroop.player].splice(enemyTroop.troopIndex, 1);
                                i -= deleteProjectilesAimingAtEnemy(room.Projectiles[i].enemyid, i, roomid);

                            } else {
                                room.Projectiles.splice(i, 1)
                                i--;
                            }
                            //room.Projectiles.splice(i,1);
                            //i--;
                        } else {
                            let velX = (tx / dist) * room.Projectiles[i].speed / 5000;
                            let velY = (ty / dist) * room.Projectiles[i].speed / 5000;
                            room.Projectiles[i].x += velX
                            room.Projectiles[i].y += velY
                        }
                    }
                    //update projectiles...
                }
            }
        }
    }
}

function findTroopWithId(id, roomid) {
    room = Rooms[findRoom(roomid)];
    for (let i = 0; i < room.troops.length; i++) {
        for (let z = 0; z < room.troops[i].length; z++) {
            if (room.troops[i][z].id == id) {
                troop = {
                    player: i,
                    troopIndex: z
                }
                return troop;
            }
        }
    }
    return null;
}

function findBulletWithId(id, roomid) {
    room = Rooms[findRoom(roomid)];
    for (let i = 0; i < room.Projectiles.length; i++) {
        if (room.Projectiles[i].id == id) {
            return i;
        }
    }
    return null;
}

function shotProjectile(OriginP, OriginT, enemyid, roomid) {
    //  console.log(OriginP, OriginT, EnemyP, EnemyT)
    room = Rooms[findRoom(roomid)];
    x = room.troops[OriginP][OriginT].x - Troops[findTroop(room.troops[OriginP][OriginT].name)].projectileSize / 200;
    y = room.troops[OriginP][OriginT].y - Troops[findTroop(room.troops[OriginP][OriginT].name)].projectileSize / 200;
    speed = Troops[findTroop(room.troops[OriginP][OriginT].name)].projectileSpeed;
    size = Troops[findTroop(room.troops[OriginP][OriginT].name)].projectileSize;
    damage = Troops[findTroop(room.troops[OriginP][OriginT].name)].damage;
    console.log(damage)
    name = room.troops[OriginP][OriginT].name;
    addProjectile(x, y, enemyid, speed, size, damage, name, OriginP, roomid, room.projectile_id);
    room.projectile_id++;
}

function findClosestEnemy(player, troop, roomid) {
    room = Rooms[findRoom(roomid)];

    closestTroop = {
        player: player == 0 ? 1 : 0,
        troopIndex: 0,
    };
    x = room.troops[player][troop].x;
    y = room.troops[player][troop].y;
    aSize = Troops[findTroop(room.troops[player][troop].name)].size / 200;
    for (let i = 0; i < room.troops.length; i++) {
        if (player != i && room.troops[i].length != 0)
            for (let z = 0; z < room.troops[i].length; z++) {
                cx = room.troops[closestTroop.player][closestTroop.troopIndex].x;
                cy = room.troops[closestTroop.player][closestTroop.troopIndex].y;
                cSize = Troops[findTroop(room.troops[closestTroop.player][closestTroop.troopIndex].name)].size / 200;
                dx = room.troops[i][z].x
                dy = room.troops[i][z].y
                dSize = Troops[findTroop(room.troops[i][z].name)].size / 200;
                if (rectRectDistance(x, y, aSize, aSize, cx, cy, cSize, cSize) > rectRectDistance(x, y, aSize, aSize, dx, dy, dSize, dSize)) {
                    closestTroop.player = i;
                    closestTroop.troopIndex = z;
                }
            }
    }
    return closestTroop;
}


io.sockets.on('connection', socket => {
    user = new User()
    user.id = socket.id
    Users.push(user)
    socket.emit("test", socket.id);
    socket.on('checkIfRoomExists', room => {
        var roomindex = findRoom(room)
        socket.emit('checkIfRoomExists', roomindex !== -1)
        if (roomindex == -1) {
            socket.emit('roomDoesntExist')
        } else {
            socket.emit('loadGameRoom', roomid)
        }
    })

    socket.on("requestGameInfo", () => {
        mode = GameModes[findMode(Rooms[findRoom(socket.roomid)].type)];
        socket.emit("requestGameInfo", mode.money, mode.time, mode.name, mode.troops); //Send game rules
    });

    socket.on("requestBattlefieldInfo", () => {
        room = Rooms[findRoom(socket.roomid)];
        let playerSide = 0;
        for (let i = 0; i < room.players.length; i++) {
            if (room.players[i].id == socket.id) {
                playerSide = i;
            }
        }
        socket.emit("requestBattlefieldInfo", room.troops, room.Projectiles, playerSide) //TODO
    })

    socket.on("sentMessage",(message)=>{
        room = Rooms[findRoom(socket.roomid)]
        room.roomMessages.push(message);
        io.in(socket.roomid).emit("updateChat", room.roomMessages)
    })

    socket.on("requestMessages", ()=>{
        socket.emit("updateChat", room.roomMessages)
    })

    socket.on("requestSpectating", ()=>{
        room = Rooms[findRoom(socket.roomid)]
        if(room.gameState == 2){
            io.to(socket.id).emit("startSpecating")
        }
        else{
            console.log("error")
        }
    })

    socket.on("submitTroops", (troops) => {
        room = Rooms[findRoom(socket.roomid)];
        let playerIndex = 0;
        for (let i = 0; i < room.players.length; i++) {
            if (room.players[i].id == socket.id) {
                room.players[i].ready = !room.players[i].ready;
                room.players[i].troops = troops;
                playerIndex = i;
            }
        }
        let playerReadyCounter = 0;
        for (let i = 0; i < room.players.length; i++) {
            if (room.players[i].ready) {
                playerReadyCounter++;
            }
        }
        for (let i = 0; i < room.players.length; i++) {
            io.to(room.players[i].id).emit("submitTroops", playerReadyCounter, room.players[i].ready)

        }
        for (let i = 0; i < room.spectators.length; i++) {
            io.to(room.spectators[i]).emit("submitTroops", playerReadyCounter, null)
        }
        if (playerReadyCounter == room.maxPlayers) {
            // socket.emit("startGame");
            room = Rooms[findRoom(socket.roomid)];
            troops = [];
            for (let i = 0; i < room.players.length; i++) {
                troops.push(room.players[i].troops);
            }
            createGame(troops, room.type, socket.roomid) //Maybe add something else so link game type... 
            room.gameState = 2;
            io.in(socket.roomid).emit("makeGameCanvas"); //HERE
        }


        // io.in(socket.roomid).emit("submitTroops",playerReadyCounter, room.players[playerIndex].ready)
        //^^ maybe send that to pe
    })

    socket.on("playerName", (name)=>{
        Users[findUser(socket.id)].name = name;
        room = Rooms[findRoom(socket.roomid)];
        if(room.spectators.indexOf(socket.id) == -1){
            for (let i = 0; i < room.players.length; i++) {
                if(room.players[i].id == socket.id){
                    room.players[i].name = name;
                }
            }
        }
        socket.emit("playerName")
      });

    socket.on("clickedCenterBtn", () => {
        room = Rooms[findRoom(socket.roomid)];
        if (room.spectators.indexOf(socket.id) !== -1) {
            //spectator
            //if players are playing send livefeed else j chill
        } else {
            //player
            for (let i = 0; i < room.players.length; i++) {
                if (room.players[i].id == socket.id) {
                    room.players[i].ready = !room.players[i].ready;
                }
            }
            gameReady = (room.players.length == room.maxPlayers)

            for (let i = 0; i < room.players.length; i++) {
                if (!room.players[i].ready) {
                    gameReady = false;
                }
            } //if gameReady still true start game
            if (gameReady) {
                room.gameState = 1; //Start GAme Pog! Send info to everyone in room
                for (let i = 0; i < room.players.length; i++) {
                    room.players[i].ready = false;

                }
                io.in(socket.roomid).emit("gameStarting");
            } else {
                SendRoomInfo(socket);
            }
        }
    });

    socket.on('requestRoomInfo', () => {
        //TODO
        //io.in('game').emit("requestRoomInfo",);
        SendRoomInfo(socket);
    })



    socket.on('connectToRoom', roomid => {
        if (findRoom(roomid) === -1) {
            socket.emit('connectToRoom', false)
        } else {
            socket.emit('connectToRoom', true)
            socket.join(roomid)
            socket.roomid = roomid;
            if (
                Rooms[findRoom(roomid)].players.length <
                Rooms[findRoom(roomid)].maxPlayers
            ) {
                //player
                player = new Player() //TODO
                player.id = socket.id
                Rooms[findRoom(roomid)].players.push(player)
                user = findUser(socket.id)
                Users[user].playing = true
                Users[user].roomid = roomid
            } else {
                Rooms[findRoom(roomid)].spectators.push(socket.id)
                user = findUser(socket.id)
                Users[user].specating = true
                Users[user].roomid = roomid
                //specator
            }
        }
    })

    socket.on('createRoom', (type, private) => {
        //add more option?
        roomid = createRoom()
        room = Rooms[findRoom(roomid)]
        room.type = type
        room.private = private
        socket.emit('loadGameRoom', roomid)
    })

    socket.on('joinRandomRoom', () => {
        let found_room = false
        var roomid = 0
        for (let i = 0; i < Rooms.length; i++) {
            if (Rooms[i].maxPlayers != Rooms[i].players.length && !Rooms[i].private) {
                found_room = true
                roomid = Rooms[i].id
            }
        }
        if (!found_room) {
            roomid = createRoom()
        }
        room = Rooms[findRoom(roomid)]
        room.type = "default" //Todo for more game modes
        room.private = false
        socket.emit('loadGameRoom', roomid)
    })

    socket.on('disconnect', () => {
        for (let i = 0; i < Users.length; i++) {
            if ((socket.id == Users[i].id)) {
                if (Users[i].playing) { //TODO if playing and leaves reset room....
                    for (let z = 0; z < Rooms[findRoom(Users[i].roomid)].players.length; z++) {
                        if (Rooms[findRoom(Users[i].roomid)].players[z].id === Users[i].id) {
                            Rooms[findRoom(Users[i].roomid)].players.splice(z, 1)
                            Rooms[findRoom(Users[i].roomid)].gameState = 0;
                        }
                    }
                }

                if (Users[i].specating) {
                    for (let z = 0; z < Rooms[findRoom(Users[i].roomid)].spectators.length; z++) {
                        if (Rooms[findRoom(Users[i].roomid)].spectators[z] === Users[i].id) {
                            Rooms[findRoom(Users[i].roomid)].spectators.splice(z, 1)
                        }
                    }
                }
                //something...
                Users.splice(i, 1)
            }
        }
        for (let i = 0; i < Rooms.length; i++) {
            if (Rooms[i].players.length == 0 && Rooms[i].spectators.length == 0) {
                //something...
                if (Rooms[i].justCreated) {
                    Rooms[i].justCreated = false
                } else {
                    if (Rooms[i].gameLoop != null) {
                        clearInterval(Rooms[i].gameLoop);
                    }
                    Rooms.splice(i, 1)
                }
            }
        }
    })
})