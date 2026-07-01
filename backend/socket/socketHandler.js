const registerSocketHandlers = (io) => {

    io.on("connection",(socket)=>{

        console.log(
            "User Connected",
            socket.id
        );

        socket.on("join-show",(showId)=>{

            socket.join(showId);

            console.log(
                `Socket ${socket.id} joined ${showId}`
            );

        });

        socket.on("disconnect",()=>{

            console.log(
                "User Disconnected",
                socket.id
            );

        });

    });

};

module.exports = registerSocketHandlers;