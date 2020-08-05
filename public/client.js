var socket = null;
//var GAMESTATE = 0;
var CreateRoomBtn = document.getElementsByClassName("CreateRoomBtn")[0];
var JoinRandomRoomBtn = document.getElementsByClassName("JoinRandomRoomBtn")[0];
var JoinRoomwithCodeBtn = document.getElementsByClassName(
  "JoinRoomwithCodeBtn"
)[0];
var RoomCodeInput = document.getElementsByClassName("RoomCodeInput")[0];
var MissingRoomError = document.getElementsByClassName("MissingRoomError")[0];
var roomid = null;

window.onload = function () {
  socket = io.connect();

  socket.on("test", (id) => {
    console.log(id);
  });

  startUp();

  socket.on("loadGameRoom", (key) => {
    window.location.href = window.location.href + "game/" + key;
  })
};

function startUp() {
  CreateRoomBtn.addEventListener("click", CreateRoom);
  JoinRandomRoomBtn.addEventListener("click", JoinRandomRoom);
  JoinRoomwithCodeBtn.addEventListener("click", JoinRoomwithCode);
  RoomCodeInput.addEventListener("keypress", function (e) {
    if (e.keyCode === 13) {
      JoinRoomwithCode();
    }
  });
}

function CreateRoom() {
  console.log("1");
  //go to create room page...
  socket.emit("createRoom", "default", false); //Add options here
}

function JoinRandomRoom() {
  console.log("2");
  socket.emit("joinRandomRoom");
}

function JoinRoomwithCode() {
  room = RoomCodeInput.value;
  console.log(room);
  //Check room
  socket.emit("checkIfRoomExists", room);
  socket.on("roomDoesntExist", () => {
    MissingRoomError.textContent = "Room Doesn't Exist!";
  });
}


// function setup() {
//     createCanvas(400, 400);
// }

// function draw() {
//     if(GAMESTATE==1){
//         background(220);
//         ellipse(50, 50, 80, 80);
//     }
// }
