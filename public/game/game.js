var socket = null;
//var GAMESTATE = 0;
let url = window.location.href.split("/");
const roomid = url[url.length - 2];

var name = "";
var Winner = null;

var ClassBtn1 = document.getElementById("ClassBtn1");
var ClassBtn2 = document.getElementById("ClassBtn2");
var ClassBtn3 = document.getElementById("ClassBtn3");
var ClassBtn4 = document.getElementById("ClassBtn4");
var ClassBtn5 = document.getElementById("ClassBtn5");
var ClassBtn6 = document.getElementById("ClassBtn6");
var ClassBtn7 = document.getElementById("ClassBtn7");

var exitRoomBtn = document.getElementById("exitRoomBtn");
var CenterBtn = document.getElementsByClassName("CenterBtn")[0];
var UpperLeftText = document.getElementsByClassName("UpperLeftText")[0];
var UpperRightText = document.getElementsByClassName("UpperRightText")[0];
var middleGrid = document.getElementById("ij7lf");
var middleGridCell = document.getElementById("idy0c");
var nameInput = document.getElementById("ityz1");
var gameOverText = null;
var gameChatTextBox = document.getElementById("gameChatTextBox");
var gameChatInput = document.getElementById("gameChatInput");
var troopPlacementInfoBox = null;

var SubmitBtn = null;
var SubmitBtnDiv = null;
var SubmitBtnState = false;

var Troops = null;
var TroopsOnBattlefield = null;
var defaultMoney = 0;
var Money = 0;
var GameModeName = null;
var Playing = false;
var MaxPlayers = 0;
var TroopSizes = [];
var TroopNames = [];
var GameState = 0;
var PlayersReady = 0;
var PlayerNames = [];

var ClassBtnArray = [ClassBtn1, ClassBtn2, ClassBtn3, ClassBtn4, ClassBtn5, ClassBtn6, ClassBtn7];
var CenterBtnState = false;
var canvas = null;
var ctx = null;
var canvasAlpha = 1;
var alphaLoop = null;

var TroopsOnCanvas = [];
var TroopPlacementOn = false;
var TroopUnitImages = [];
var TroopEnemyUnitImages = [];
var projectileImages = [];
var enemyProjectileImages = [];
var Projectiles = [];

var lineWidth = 0;
var currentTroop = null;
var hoveringTroop = false;
var DrawGame = false;
var PlayerSide = 0;
var Spectating = false;

var LastMousePressInfo = {
  x: 0,
  y: 0
};
var MouseIsPressed = false;
// ClassBtn.src = "ClassLogos/MeleeLogo3.png"
//ClassLogos/ArcherLogo.jpg 


window.onload = function () {
  socket = io.connect();


  socket.emit("connectToRoom", roomid);
  socket.on("connectToRoom", (connected) => {
    //idk
    let temp = window.location.href.split("")
    let i = temp.length - 1;
    let z = 2;
    while (z != 0) {
      i--
      if (temp[i] == "/")
        z--;
      temp.splice(temp.length - 1, 1);
    }
    exitRoomBtn.addEventListener("click", function () {
      window.location.href = temp.join("");
    })
    if (!connected) {
      nameInput.style.display = "none";
      CenterBtn.style.display = "inline";
      CenterBtn.textContent = "Room Doesnt Exist"
      CenterBtn.addEventListener("click", function () {
        window.location.href = temp.join("");
      })
    } else {
      UpperLeftText.textContent = "Game Room: " + roomid;
      startUp();
    }
  });


};

function saveName(e) {
  if (e.keyCode == 13) {
    name = nameInput.value;
    if (name == "")
      name = "unNamed"
    nameInput.style.display = "none";
    gameChatInput.style.display = "inline";
    gameChatTextBox.style.display = "inline";

    gameChatInput.addEventListener("keydown", (e) => {
      sendMessage(e);
    })
    socket.emit("sentMessage", name + " has joined!");
    socket.emit("playerName", name);
  }
}

function startUp() {
  //CenterBtn.style.display = "none";
  nameInput.addEventListener("keydown", (e) => {
    saveName(e);
  })


  socket.emit("requestMessages");

  socket.on("playerName", () => {
    CenterBtn.style.display = "inline";
    socket.emit("requestRoomInfo");
    socket.emit("requestGameInfo");
  });


  socket.on("requestRoomInfo", (playing, players, spectators, playersReady, maxPlayers, gameState) => {
    PlayersReady = playersReady;
    GameState = gameState;
    MaxPlayers = maxPlayers;
    Playing = playing;
    if (playing) {
      CenterBtn.textContent = "Click to Ready up! " + playersReady + "/" + maxPlayers + " Ready!";
    } else {
      if (GameState == 0) { //TODO
        CenterBtn.textContent = "Click to Watch Game! " + playersReady + "/" + maxPlayers + " Players Readied Up!";
      } else if (GameState == 1) { //TODO
        CenterBtn.textContent = "Click to Watch Game! " + playersReady + "/" + maxPlayers + " Players have Placed Toops!";
      } else
        CenterBtn.textContent = "Click to Watch Game! It has Already Started!";
    }
    let names = []
    for (let i = 0; i < players.length; i++) {
      names.push(players[i].name)
    }
    PlayerNames = names;
    UpperLeftText.textContent = "Game Room: " + roomid + "  Spectators: " + spectators + "\nPLayer Names: " + names;
    CenterBtn.addEventListener("click", activateCenterBtn);
    //do something
  });

  socket.on("requestGameInfo", (money, time, gameModeName, troops) => { //game rules
    if (defaultMoney == 0) {
      Money = money
    }
    defaultMoney = money;
    UpperRightText.textContent = "Game Mode: " + gameModeName
    if (Playing)
      UpperRightText.textContent = "Game Mode: " + gameModeName + "   Money: $" + Money;
    Time = time;
    GameModeName = gameModeName;
    Troops = troops;
    if (Playing) {
      for (let i = 0; i < troops.length; i++) {
        ClassBtnArray[i].src = "ClassLogos/" + troops[i].name + "Logo.jpg";
      }
    }
    for (let i = 0; i < troops.length; i++) {
      img = new Image()
      img.src = "unitImages/" + troops[i].name + ".png"
      TroopUnitImages.push(img);
      img.onload = () => {

      }
    }
    for (let i = 0; i < troops.length; i++) {
      img = new Image()
      img.src = "enemyUnitImages/" + troops[i].name + ".png"
      TroopEnemyUnitImages.push(img);
      img.onload = () => {

      }
    }
    for (let i = 0; i < troops.length; i++) {
      img = new Image()
      img.src = "projectileImages/" + troops[i].name + ".png"
      projectileImages.push(img);
      img.onload = () => {

      }
    }
    for (let i = 0; i < troops.length; i++) {
      img = new Image()
      img.src = "enemyProjectileImages/" + troops[i].name + ".png"
      enemyProjectileImages.push(img);
      img.onload = () => {

      }
    }
    for (let i = 0; i < troops.length; i++) {
      TroopNames.push(troops[i].name);
    }
    //ClassBtn.style.visibility = "visible";
    // ClassBtn.src = "ClassLogos/MeleeLogo3.png"
    //ClassLogos/ArcherLogo.jpg 

    //do something
  });

  socket.on("gameStarting", () => {
    CenterBtn.style.visibility = "none"
    if (Playing) {
      for (let i = 0; i < Troops.length; i++) {
        ClassBtnArray[i].style.visibility = "visible";
      }

      canvas = document.createElement('canvas');
      try {
        middleGridCell.parentNode.removeChild(middleGridCell);
      } catch {
        //do something?
      }


      SubmitBtnDiv = document.createElement('div');
      SubmitBtnDiv.className = "SubmitBtnDiv"
      middleGrid.appendChild(SubmitBtnDiv);

      canvas.width = middleGrid.clientWidth * 51 / 100;
      canvas.height = middleGrid.clientHeight;
      ctx = canvas.getContext("2d");
      SubmitBtnDiv.appendChild(canvas)

      troopPlacementInfoBox = document.createElement('div');
      troopPlacementInfoBox.className = "gpd-text"
      troopPlacementInfoBox.id = "troopPlacementInfoBox"
      troopPlacementInfoBox.textContent = "You may use the number keys to select troops. You may use backspace to delete troops. To select troops you may click on them or when your cursor is the default you may drag it in a rectangle selecting all troops inside."
      SubmitBtnDiv.appendChild(troopPlacementInfoBox);

      SubmitBtn = document.createElement('button');
      SubmitBtn.className = "btn btn-primary SubmitBtn"
      SubmitBtn.width = "100%";
      SubmitBtn.height = "100%";
      SubmitBtn.textContent = "Click to Submit Layout!\n" + "0" + "/" + MaxPlayers + " Players Ready"
      SubmitBtn.addEventListener("click", submitTroops)
      SubmitBtnDiv.appendChild(SubmitBtn);

      middleGridCell.style.justifyContent = "flex-start";
      //justify-content:center; 

      TroopPlacementOn = true;
      for (let i = 0; i < Troops.length; i++) {
        TroopSizes[i] = Troops[i].size * canvas.width / 51;
      }

      troopBtnActivate();
      //troopPlacement(); 
    } else {
      PlayersReady = 0;
      CenterBtn.textContent = "Waiting on players to place Troops" + PlayersReady + "/" + MaxPlayers + " Ready!";
      //spectators? 
    }
  })

  socket.on("submitTroops", (playersReady, userReady) => {
    PlayersReady = playersReady;
    if (Playing) {
      if (userReady) {
        for (let i = 0; i < Troops.length; i++) {
          ClassBtnArray[i].style.borderColor = "0060c7"
        }
        TroopPlacementOn = false;
        SubmitBtn.textContent = "Ready!\n" + playersReady + "/" + MaxPlayers + " Players Ready"
        SubmitBtn.style.backgroundColor = "#90ee90";
      } else {
        TroopPlacementOn = true;
        SubmitBtn.textContent = "Click to Submit Layout!\n" + playersReady + "/" + MaxPlayers + " Players Ready"
        SubmitBtn.style.backgroundColor = "#095a5e";
      }


    } else {
      if (CenterBtn.style.backgroundColor == "#095a5e")
        CenterBtn.textContent = "Waiting on players to place Troops" + playersReady + "/" + MaxPlayers + " Ready!";
      else {
        CenterBtn.textContent = "Click to Watch Game! " + playersReady + "/" + MaxPlayers + " Players have Placed Toops!";
      }
      //inform spectators TODO

    }
  })

  socket.on("gameFinished", (winner) => {
    alphaLoop = setInterval(bluroutCanvas, 1000 / 30);
    Winner = winner;
  })

  socket.on("makeGameCanvas", () => {
    if (Playing) {
      troopPlacementInfoBox.style.display = "none";
      try {
        SubmitBtn.parentNode.removeChild(SubmitBtn);
      } catch {}
      canvas.width = middleGrid.clientWidth;
      canvas.height = middleGrid.clientHeight;
      DrawGame = true;
    } else {
      if (CenterBtn.style.backgroundColor != "#095a5e") {
        socket.emit("requestSpectating")
        //TODO
      } else {
        CenterBtn.textContent = "Click to Watch Game! It has Already Started!"; //HEREE
      }
      //inform specators that game started //TODO
    }
  })

  socket.on("startSpecating", () => {
    canvas = document.createElement('canvas');
    try {
      middleGridCell.parentNode.removeChild(middleGridCell);
    } catch {
      //do something?
    }
    SubmitBtnDiv = document.createElement('div');
    SubmitBtnDiv.className = "SubmitBtnDiv"
    middleGrid.appendChild(SubmitBtnDiv);

    canvas.width = middleGrid.clientWidth;
    canvas.height = middleGrid.clientHeight;
    ctx = canvas.getContext("2d");
    SubmitBtnDiv.appendChild(canvas)
    middleGridCell.style.justifyContent = "flex-start";
    //justify-content:center; 
    DrawGame = true;
  })

  socket.on("requestBattlefieldInfo", (troops, projectiles, playerSide) => {
    TroopsOnBattlefield = troops;
    PlayerSide = playerSide
    drawTroops(troops);
    drawProjectiles(projectiles);
  })

  socket.on("updateChat", (messages) => {
    updateChat(messages);
  })

  socket.on("playerDisconnected", () => {
    troopPlacementInfoBox = document.createElement('div');
    troopPlacementInfoBox.className = "gpd-text"
    troopPlacementInfoBox.id = "playerDisconnectedInfoBox"
    troopPlacementInfoBox.textContent = "Unfortunately a player has disconnect. Room will be deactivated. You may still use the chat, but in order to play a game please create a new room."
    
    if (nameInput.style.display == "none") {
      //entered name
      if (GameState == 0){
        CenterBtn.style.display = "none"
        middleGridCell.appendChild(troopPlacementInfoBox);
      }else if (GameState == 1){
        SubmitBtnDiv.parentNode.removeChild(SubmitBtnDiv);
        middleGrid.appendChild(troopPlacementInfoBox);
        middleGrid.style.alignItems = "center";
        middleGrid.style.justifyContent = "center";
        
        for (let i = 0; i < Troops.length; i++) {
          ClassBtnArray[i].style.visibility = "visible";
        }
  
      }else{ 
        SubmitBtnDiv.parentNode.removeChild(SubmitBtnDiv);
        middleGrid.appendChild(troopPlacementInfoBox);
        middleGrid.style.alignItems = "center";
        middleGrid.style.justifyContent = "center";
        if(gameOverText.style.display == "inline"){
          gameOverText.style.display = "none"
        }
        for (let i = 0; i < Troops.length; i++) {
          ClassBtnArray[i].style.visibility = "visible";
        }
  
      }
    } else {
      nameInput.style.display = "none"
      middleGridCell.appendChild(troopPlacementInfoBox);
    }
  })
}

function updateChat(messages) {
  let moveScrollBar = gameChatTextBox.scrollTop != gameChatTextBox.scrollHeight; // todo fix this 
  gameChatTextBox.value = "";
  for (let i = 0; i < messages.length; i++) {
    gameChatTextBox.value += messages[i];
    if (i != messages.length - 1)
      gameChatTextBox.value += "\n";
  }
  if (moveScrollBar)
    gameChatTextBox.scrollTop = gameChatTextBox.scrollHeight;
}

function sendMessage(e) {
  if (e.keyCode == 13) {
    message = gameChatInput.value;
    gameChatInput.value = "";
    var d = new Date();
    fullMessage = name + " " + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()) + ":" + d.getSeconds() + ": " + message;
    socket.emit("sentMessage", fullMessage);
  }
}

function submitTroops() {
  for (let i = 0; i < TroopsOnCanvas.length; i++) {
    TroopsOnCanvas[i].highlight = false;
  }
  socket.emit("submitTroops", TroopsOnCanvas);
}

function bluroutCanvas() {
  ctx.globalAlpha = canvasAlpha;
  canvasAlpha -= .1 / 6;
  if (canvasAlpha - .1 / 6 < 0) {
    canvas.parentNode.removeChild(canvas);
    canvas = null;
    DrawGame = false;
    gameOverScreen()
    clearInterval(alphaLoop);
  }
}

function gameOverScreen() {
  gameOverText = document.createElement("gpd-text")
  gameOverText.id = "gameOverText";
  middleGrid.style.alignItems = "center";
  //middleGrid.style.justifyContent  = "center";

  // align-items:center;
  // justify-content:center;
  middleGrid.appendChild(gameOverText);
  gameOverText.style.display = "inline";
  if (Playing) {
    if (Winner == PlayerSide) {
      gameOverText.textContent = "Victory!"
    } else {
      gameOverText.textContent = "Defeat!"
    }
  } else {
    gameOverText.textContent = PlayerNames[Winner] + " Wins!"
  }
}

function getTroopAtMouse(x, y) {
  troopBorderpx = 5;
  for (let i = TroopsOnCanvas.length - 1; i >= 0; i--) {
    py = (document.documentElement.clientHeight + y - window.screen.height * 7 / 100) + TroopSizes[TroopsOnCanvas[i].troop] / 2;
    px = x + TroopSizes[TroopsOnCanvas[i].troop] / 2;
    //console.log(x, y, TroopsOnCanvas[i].x * canvas.width, TroopsOnCanvas[i].y * canvas.height)
    if (px >= TroopsOnCanvas[i].x * canvas.width &&
      px <= TroopsOnCanvas[i].x * canvas.width + TroopSizes[TroopsOnCanvas[i].troop] &&
      py + troopBorderpx >= TroopsOnCanvas[i].y * canvas.height &&
      py <= TroopsOnCanvas[i].y * canvas.height + TroopSizes[TroopsOnCanvas[i].troop]) {
      return i;
    }
  }
  return -1;
}

function troopBtnActivate() {
  for (let i = 0; i < Troops.length; i++) {
    ClassBtnArray[i].addEventListener("click", function () {
      changeCurrentTroop(i);
    }) //might not work
  }
}

function changeCurrentTroop(troop) {
  if (TroopPlacementOn) {
    if (troop == currentTroop) {
      currentTroop = null;
    } else {
      currentTroop = troop;
    }
    for (let i = 0; i < Troops.length; i++) {
      ClassBtnArray[i].style.borderColor = "0060c7"
    }
    if (currentTroop != null) {
      ClassBtnArray[currentTroop].style.borderColor = "green"
    }
  }
}

function activateCenterBtn() {
  CenterBtnState = !CenterBtnState;
  socket.emit("clickedCenterBtn");
  if (!CenterBtnState) {
    CenterBtn.style.backgroundColor = "#095a5e";
    CenterBtn.removeEventListener("click", activateCenterBtn);
    socket.emit("requestRoomInfo");

  } else {
    CenterBtn.style.backgroundColor = "#90ee90";
    if (Playing) {
      //request if everyone accepted
      CenterBtn.textContent = "Ready!"
    } else {
      //request game State 
      if (GameState == 0) {
        //game didnt start  
        CenterBtn.textContent = "Waiting on players" + PlayersReady + "/" + MaxPlayers + " Ready!";
      } else if (GameState == 1) {
        //game didnt start  
        CenterBtn.textContent = "Waiting on players to place Troops" + PlayersReady + "/" + MaxPlayers + " Ready!";
      } else {
        socket.emit("requestSpectating")
        //start specating
      }
    }
  }
  //temp TODO****

};

function keyPressed() {
  if (TroopPlacementOn) {
    for (let i = 0; i < Troops.length; i++) {
      if (keyCode == i + 49 + "") {
        for (let i = 0; i < TroopsOnCanvas.length; i++) {
          TroopsOnCanvas[i].highlight = false;
        }
        changeCurrentTroop(i);
        //placeTroop(i, mouseX, mouseY);
      }
    }
    if (keyCode == "8") {
      for (let i = 0; i < TroopsOnCanvas.length; i++) {
        if (TroopsOnCanvas[i].highlight == true) {
          Money += Troops[TroopsOnCanvas[i].troop].cost;
          UpperRightText.textContent = "Game Mode: " + GameModeName + "   Money: $" + Money;
          TroopsOnCanvas.splice(i, 1);
          i--;
        }
      }
    }
  }
}

function mouseClicked() {
  y = document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100;
  x = mouseX
  if (hoveringTroop && dist(LastMousePressInfo.x, LastMousePressInfo.y, x, y) < 20) {
    placeTroop(currentTroop, mouseX, mouseY);
  } else if (currentTroop == null) {
    troop = getTroopAtMouse(mouseX, mouseY);

    if (troop != -1) {
      TroopsOnCanvas[troop].highlight = true;
    } //highlight
  }
}

function mousePressed() {
  if (TroopPlacementOn &&
    mouseX < canvas.width - lineWidth &&
    document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100 < canvas.height &&
    document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100 > 0) {
    MouseIsPressed = true;
    LastMousePressInfo.x = mouseX
    LastMousePressInfo.y = document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100
  }
}

function mouseReleased() {
  MouseIsPressed = false;
  y = document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100;
  x = mouseX
  if (currentTroop == null &&
    y < canvas.height &&
    y * 7 / 100 > 0) {
    //idk
    getTroopsInsideRect(LastMousePressInfo.x > x ? x : LastMousePressInfo.x,
      LastMousePressInfo.y > y ? y : LastMousePressInfo.y,
      LastMousePressInfo.x < x ? x : LastMousePressInfo.x,
      LastMousePressInfo.y < y ? y : LastMousePressInfo.y)
  }
}

function getTroopsInsideRect(x, y, dx, dy) {
  for (let i = 0; i < TroopsOnCanvas.length; i++) {
    TroopsOnCanvas[i].highlight = false;
  }
  troopsInsideRectArray = [];
  for (let i = 0; i < TroopsOnCanvas.length; i++) {
    px = TroopsOnCanvas[i].x * canvas.width;
    py = TroopsOnCanvas[i].y * canvas.height;
    if (px >= x &&
      px <= dx &&
      py >= y &&
      py <= dy) {
      troopsInsideRectArray.push(i);
      TroopsOnCanvas[i].highlight = true;
    }
  }
}

// function troopPlacement(){
//   canvas.addEventListener("keypress", (event)=>{
//     console.log(event.key);
//     if(event.key == "81"){
//       placeTroop(0);
//     }
//     if(event.key == "87"){
//       placeTroop(0);
//     }
//     if(event.key == "69"){
//       placeTroop(0);
//     }

//   })
// }

function placeTroop(troop, x, y) {
  if (x - TroopSizes[troop] / 2 > 0 &&
    x < canvas.width - lineWidth - TroopSizes[troop] / 2 &&
    document.documentElement.clientHeight + y - window.screen.height * 7 / 100 + TroopSizes[troop] / 2 < canvas.height &&
    document.documentElement.clientHeight + y - window.screen.height * 7 / 100 - TroopSizes[troop] / 2 > 0 &&
    Money - Troops[troop].cost >= 0) {
    Money -= Troops[troop].cost
    UpperRightText.textContent = "Game Mode: " + GameModeName + "   Money: $" + Money;
    troopObj = {
      troop: troop,
      x: x / canvas.width,
      y: (document.documentElement.clientHeight + y - window.screen.height * 7 / 100) / canvas.height,
      highlight: false,
      name: Troops[troop].name,
      pastAttackTime: 0,
      hp: Troops[troop].hp,
    }
    TroopsOnCanvas.push(troopObj);
    // img = new Image()
    // img.src = "unitImages/"+Troops[troop].name+".png"
    // img.onload = ()=>{
    // ctx.drawImage(img,x,canvas.height+y, 100,100);
  }
}

//color******* #105030

function setup() {
  var cvs = createCanvas(0, 0);

}

window.onresize = changeCanvas;

function changeCanvas() {
  if (canvas != null && ctx != null) {
    ctx.globalAlpha = canvasAlpha;
    if (TroopPlacementOn) {

      canvas.width = middleGrid.clientWidth * 51 / 100;
      canvas.height = middleGrid.clientHeight;
    }
    if (DrawGame) {
      canvas.width = middleGrid.clientWidth;
      canvas.height = middleGrid.clientHeight;
    }
  }
}

function draw() {

  frameRate(144)
  if (TroopPlacementOn) {
    for (let i = 0; i < Troops.length; i++) {
      TroopSizes[i] = Troops[i].size * canvas.width / 51;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lineWidth = canvas.width / 51;
    ctx.moveTo(canvas.width - lineWidth / 2, 0);
    ctx.lineTo(canvas.width - lineWidth / 2, canvas.height);
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 5;
    for (let i = 0; i < TroopsOnCanvas.length; i++) {
      ctx.drawImage(TroopUnitImages[TroopsOnCanvas[i].troop],
        TroopsOnCanvas[i].x * canvas.width - TroopSizes[TroopsOnCanvas[i].troop] / 2,
        TroopsOnCanvas[i].y * canvas.height - TroopSizes[TroopsOnCanvas[i].troop] / 2,
        TroopSizes[TroopsOnCanvas[i].troop],
        TroopSizes[TroopsOnCanvas[i].troop]);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 5;
      if (TroopsOnCanvas[i].highlight)
        ctx.strokeRect(TroopsOnCanvas[i].x * canvas.width - TroopSizes[TroopsOnCanvas[i].troop] / 2,
          TroopsOnCanvas[i].y * canvas.height - TroopSizes[TroopsOnCanvas[i].troop] / 2,
          TroopSizes[TroopsOnCanvas[i].troop],
          TroopSizes[TroopsOnCanvas[i].troop]);
    }

    x = mouseX
    y = mouseY
    if (MouseIsPressed && currentTroop == null) {
      document.querySelector("body").style.cursor = "none";
      x = mouseX
      y = document.documentElement.clientHeight + mouseY - window.screen.height * 7 / 100
      ctx.strokeRect(LastMousePressInfo.x, LastMousePressInfo.y, x - LastMousePressInfo.x, y - LastMousePressInfo.y);
    } else if (currentTroop != null &&
      x - TroopSizes[currentTroop] / 2 > 0 &&
      x < canvas.width - lineWidth - TroopSizes[currentTroop] / 2 &&
      document.documentElement.clientHeight + y - window.screen.height * 7 / 100 + TroopSizes[currentTroop] / 2 < canvas.height &&
      document.documentElement.clientHeight + y - window.screen.height * 7 / 100 - TroopSizes[currentTroop] / 2 > 0) {
      ctx.strokeStyle = '#000000';

      hoveringTroop = true;
      document.querySelector("body").style.cursor = "none";
      var s = TroopUnitImages[currentTroop]
      //s.style.opacity = ".1"; //try again?
      ctx.drawImage(s,
        x - TroopSizes[currentTroop] / 2,
        document.documentElement.clientHeight + y - window.screen.height * 7 / 100 - TroopSizes[currentTroop] / 2,
        TroopSizes[currentTroop],
        TroopSizes[currentTroop])

    } else {
      hoveringTroop = false;
      document.querySelector("body").style.cursor = "default";
    }
    ctx.strokeStyle = '#000000';
  }

  if (DrawGame) {
    socket.emit("requestBattlefieldInfo")
  }

}

function drawTroops(troops) {
  for (let i = 0; i < Troops.length; i++) {
    TroopSizes[i] = Troops[i].size * canvas.width / 100;
  }
  TroopsOnBattlefield = troops;
  // console.log(troops[i][z].x,troops[i][z].y)
  if (PlayerSide == 1) {
    for (let i = 0; i < troops.length; i++) {
      for (let z = 0; z < troops[i].length; z++) {
        if (i == 0) {
          troops[i][z].x = (1 - troops[i][z].x)
        } else {
          troops[i][z].x = (1 - troops[i][z].x)
        }
      }
    }
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < troops.length; i++) {
    for (let z = 0; z < troops[i].length; z++) {
      if (i == PlayerSide) {
        ctx.drawImage(TroopUnitImages[troops[i][z].troop],
          troops[i][z].x * canvas.width - TroopSizes[troops[i][z].troop] / 2,
          troops[i][z].y * canvas.height - TroopSizes[troops[i][z].troop] / 2,
          TroopSizes[troops[i][z].troop],
          TroopSizes[troops[i][z].troop]);
        ctx.strokeStyle = '#ff0000';
        ctx.fillRect(troops[i][z].x * canvas.width - TroopSizes[troops[i][z].troop] / 2,
          troops[i][z].y * canvas.height + TroopSizes[troops[i][z].troop] / 2 + canvas.height / 500,
          TroopSizes[troops[i][z].troop] * troops[i][z].hp / Troops[troops[i][z].troop].hp,
          canvas.height / 100);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 5;

      } else {
        ctx.drawImage(TroopEnemyUnitImages[troops[i][z].troop],
          troops[i][z].x * canvas.width - TroopSizes[troops[i][z].troop] / 2,
          troops[i][z].y * canvas.height - TroopSizes[troops[i][z].troop] / 2,
          TroopSizes[troops[i][z].troop],
          TroopSizes[troops[i][z].troop]);
        ctx.strokeStyle = '#ff0000';
        ctx.fillRect(troops[i][z].x * canvas.width - TroopSizes[troops[i][z].troop] / 2,
          troops[i][z].y * canvas.height + TroopSizes[troops[i][z].troop] / 2 + canvas.height / 500,
          TroopSizes[troops[i][z].troop] * troops[i][z].hp / Troops[troops[i][z].troop].hp,
          canvas.height / 100);

        if (troops[i][z].highlight)
          ctx.strokeRect(troops[i][z].x * canvas.width - TroopSizes[troops[i][z].troop] / 2,
            troops[i][z].y * canvas.height - TroopSizes[troops[i][z].troop] / 2,
            TroopSizes[troops[i][z].troop],
            TroopSizes[troops[i][z].troop]);
      }

    }
  }
}



function drawProjectiles(projectiles) {
  Projectiles = projectiles;
  if (PlayerSide == 1) {
    for (let i = 0; i < projectiles.length; i++) {
      projectiles[i].x = (1 - projectiles[i].x)
    }
  }
  for (let i = 0; i < projectiles.length; i++) {
    let img = null;
    if (projectiles[i].OriginP == PlayerSide) {
      img = projectileImages[TroopNames.indexOf(projectiles[i].name)]
    } else {
      img = enemyProjectileImages[TroopNames.indexOf(projectiles[i].name)]
    }
    ctx.drawImage(img,
      projectiles[i].x * canvas.width - projectiles[i].size / 2,
      projectiles[i].y * canvas.height - projectiles[i].size / 2,
      projectiles[i].size * canvas.width / 100,
      projectiles[i].size * canvas.width / 100);
  }
}

//TODO for tmr, make user able to enter a name...
// center btn for playing/ specating
// player can be waiting or playing same for specators
// start basic game
// mostly handle more UI stuff and not much game stuff...

//unit collision/ bullet collision 