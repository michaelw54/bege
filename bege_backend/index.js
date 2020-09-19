const io = require("socket.io");
const server = io.listen(8000);

let socketToPlayer = new Map();

let id = 1;

class Player {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
    }
}

server.on("connection", (socket) => {
    const player = new Player("player " + id.toString(), 200, 200);
    id += 1;
    socketToPlayer.set(socket, player);

    socket.on("updateServer", data => {
        // update player data
        player.x = data.x;
        player.y = data.y;
        socketToPlayer.set(socket, player);
    });

    // update client every 10ms -- ping is effectively 10ms
    setInterval(() => {
        socket.emit("updateClient", Array.from(socketToPlayer.values()));
    }, 10);

    socket.on("disconnect", () => {
        socketToPlayer.delete(socket);
    });
});