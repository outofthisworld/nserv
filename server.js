const logger = require("./logger");
const cluster = require("cluster");
const os = require("os");
const ip = require("ip");
const protobuf = require("protobuf");
const gameloop = require("node-gameloop");

//Clean up later just experimenting with docker cluster and multi process cluster :))
class Server {
  start() {
    if (cluster.isMaster) {
      //When any of the workers die the cluster module will emit the 'exit' event.
      //This can be used to restart the worker by calling .fork() again.
      cluster.on("exit", (worker, code, signal) => {
        logger.log({
          level: "info",
          message: `Damn.. one of our processes died, lets fix that! ... ${code}`
        });
        //
        cluster.fork();
      });
      /*
        Emitted after the worker IPC channel has disconnected. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with worker.disconnect()).
        There may be a delay between the 'disconnect' and 'exit' events. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.
        */
      cluster.on("disconnect", worker => {
        console.log(`The worker #${worker.id} has disconnected`);
      });

      //When a new worker is forked the cluster module will emit a 'fork' event.
      //This can be used to log worker activity, and create a custom timeout.
      cluster.on("fork", worker => {
        logger.log({
          level: "info",
          message: `Forked new worker proccess ${worker.process.id}.`
        });
      });

      /*
          After forking a new worker, the worker should respond with an online message. 
          When the master receives an online message it will emit this event. 
          The difference between 'fork' and 'online' is that fork is emitted when the
           master forks a worker, and 'online' is emitted when the worker is running.

        */
      cluster.on("online", worker => {
        logger.log({
          level: "info",
          message: `Worker ${worker.process.id} is now online and running `
        });
      });

      //When the master recieves a message from any of the workers
      cluster.on("message", (client, message, handle) => {
        logger.log({
          level: "info",
          message: `Recieved message from worker... ${worker.process
            .id} ${JSON.stringify(message)}`
        });
        if (message && message.type === "packet") {
          world.emit("packet", { client, message });
        }
      });

      /*
           After calling listen() from a worker, when the 'listening' event is emitted on the server a 
          'listening' event will also be emitted on cluster in the master.
        */
      cluster.on("listening", (worker, address) => {
        logger.log({
          level: "info",
          message: `A worker is now connected to ${address.address}:${address.port}`
        });
      });

      const numCores = this.numProcesses || os.cpus().length;
      for (let i = 0; i < numCores; i++) {
        cluster.fork();
      }

      const peers = ["192.168.1.1"];
      const messages = require("./appproto.js");

      if (peers[0] === ip.address()) {
        const masterServ = net.createServer(socket => {
          if (peers.indexOf(socket.remoteHost) === -1) {
            logger.log({
              level: "info",
              message:
                "recieved connections from unknown host " + socket.remoteHost
            });
            socket.close();
          }

          masterServ.on("broadcast", data => {
            socket.send(data);
          });

          masterServer.on("sendToHost", (host, data) => {
            if (socket.removeHost === host) {
              socket.send(data);
            }
          });

          let buf = new Buffer();
          //One of our slaves is messaging us
          socket.on("data", function(chunk) {});

          //one of our slaves is out
          socket.on("close", function() {});
        });

        let serverLoopId;

        //Emitted when the server has been bound after calling server.listen().
        masterServer.on("listening", () => {
          if (peers[0] === ip.address()) {
            serverLoopId = gameloop.setGameLoop(function(delta) {
              const encodedMessage = messages.Packet.encode({
                id: 1
              });

              const buf = Buffer.from([1, encodedMessage.length]);
              const payload = Buffer.concat([buf, encodedMessage]);

              masterServ.emit("broadcast", payload);
            }, 1000 / 60);
          }
        });
        //Emitted when the server closes. Note that if connections exist,
        // this event is not emitted until all connections are ended.
        masterServer.on("close", () => {
          gameloop.clearGameLoop(serverLoopId);
        });
        //Emitted when an error occurs. Unlike net.Socket, the 'close' event
        // will not be emitted directly following this event unless server.close()
        //is manually called. See the example in discussion of server.listen().
        masterServ.on("error", function() {
          gameloop.clearGameLoop(id);
        });
        server.listen(3999);
      } else {
        const net = require("net");
        const socket = new net.Socket();

        socket.setTimeout(5000);

        //Emitted when a socket connection is successfully established. See net.createConnection().
        socket.on("connect", function() {
          logger.log({
            level: "info",
            message: "Succesfully connected to server " + peers[0]
          });
        });
        //Emitted when a socket is ready to be used. Triggered immediately after connect
        socket.on("ready", function() {
          //start
          logger.log({
            level: "info",
            message:
              "Ready to start sending and recieving data to server : " +
              peers[0]
          });
        });

        //Emitted when data is received. The argument data will be a Buffer or String. Encoding of data is set by socket.setEncoding().
        socket.on("data", function(data) {
          //socket.write()
        });

        //Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.
        socket.on("end", function() {});

        //Emitted if the socket times out from inactivity. This is only to notify that the socket has been idle. The user must manually close the connection.
        socket.on("timeout", function() {
          //Check communication with master, no heartbeat recieved
        });

        //close will then be called directly after
        socket.on("error", function(err) {});
        //Emitted once the socket is fully closed. The argument hadError is a boolean which says if the socket was closed due to a transmission error.
        socket.on("close", function(hadError) {});
      }
    } else {
      const net = require("net");
      const packet = function(id) {
        return id;
      };
      const server = net.createServer(socket => {
        // connections never end

        //read data
        //process packet

        //Send packet data to master to process on world

        socket.on("data", () => {
          //if packet receieved
          if (true) {
            //send the packet to the master process
            process.send({
              //Map our packet to an object
              packet: packet(1)
            });
          }
        });

        //Recieved message from master process
        process.on("message", function(message) {
          switch (message.type) {
            case "":
              break;
          }
        });
      });

      //Occurs when server experiences an error, for this
      //we will handle by sending a message to the master process to kill and refork
      server.on("error", function() {
        process.send({
          type: "error",
          action: "kill"
        });
      });

      server.listen(8000);
    }
  }
}

module.exports = Server;
