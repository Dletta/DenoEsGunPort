import { serve } from "https://deno.land/std/http/server.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
} from "https://deno.land/std/ws/mod.ts";

var server = serve('localhost:8080');
var httpserv = serve('localhost:8081');

async function handleWs(sock) {
  console.log("socket connected!");
  conns.add(sock)
  try {
    for await (const ev of sock) {
      if (typeof ev === "string") {
        // text message
        console.log("ws:Text", ev);
        await sock.send(ev);
      } else if (ev instanceof Uint8Array) {
        // binary message
        console.log("ws:Binary", ev);
      } else if (isWebSocketPingEvent(ev)) {
        const [, body] = ev;
        // ping
        console.log("ws:Ping", body);
      } else if (isWebSocketCloseEvent(ev)) {
        // close
        const { code, reason } = ev;
        conns.delete(sock);
        console.log("ws:Close", code, reason);
      }
    }

  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!sock.isClosed) {
      await sock.close(1000).catch(console.error);
    }
  }
}

var conns = new Set();

async function main () {
  console.log('Server started: localhost:8080');


  for await (let req of server) {

    const { conn, r:bufReader, w:bufWriter, headers } = req;
    console.log(conn);
    console.log(req.headers);

    try{
        var socket = await acceptWebSocket({
          conn,
          bufReader,
          bufWriter,
          headers,
        });
        await handleWs(socket);
    } catch (e) {
      console.log('error::',e)
    }

  }

}

async function main2 () {
  for await (let req of httpserv) {
    var uuid = v4.generate();
    req.respond({body:'<html><body>Hello Deary! You are unique '+uuid+'! '+conns.size+'</body></html>'})
  }
}


main();
main2();
