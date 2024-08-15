import { Server } from "bun";

const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return;
    return new Response("This is a websocket server");
  },
  websocket: {
    open(ws) {
      console.log(`Client has connected`);

      const message = { sender: `session`, target: `scene`, type: `connected` };
      ws.subscribe(`session`);
      ws.send(JSON.stringify(message));
    },
    message(ws, message) {
      console.log(message);
      ws.send(`Foo bar`);
    },
  },
  port: 8080,
});

console.log(`Server started on: ${server.port}`);

function setRowsCols(server: Server, rows: number, cols: number) {
  const message = {
    sender: `session`,
    target: `scene`,
    type: `set-dims`,
    data: {
      rows: 3,
      cols: 3,
    },
  };

  server.publish(`session`, JSON.stringify(message));
}
