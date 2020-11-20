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

        /* This is where we implement the gun wire protocol */
        var inObj = JSON.parse(ev);

        if(Array.isArray(inObj)){
          //deal with array
          var arr = inObj;
        } else {
          var arr = [inObj];
        }
        var l = arr.length;
        for(let i = 0; i<l; i++){
          let item = arr[i];
          if(item.dam){
            console.log('got from');
            console.log(item.dam, sock.id);
            if(item.dam == 'bye'){ sock.close()};
          }
          if(item.get) {
            //handle get request
            broadcast(item, sock.id);
          }
          if(item.put) {
            //handle put request

          }
        }

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

function State() {
  var t;
  t = +new Date;
  if(last < t) {
    return N = 0, last = t;
  }
}

function HAM(machineState, incomingState, currentState, incomingValue, currentValue){
	if(machineState < incomingState){
		return {defer: true}; // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
	}
	if(incomingState < currentState){
		return {historical: true}; // the incoming value is within the boundary of the machine's state, but not within the range.
	}
	if(currentState < incomingState){
		return {converge: true, incoming: true}; // the incoming value is within both the boundary and the range of the machine's state.
	}
	if(incomingState === currentState){
		incomingValue = JSON.stringify(incomingValue) || "";
		currentValue = JSON.stringify(currentValue) || "";
		if(incomingValue === currentValue){ // Note: while these are practically the same, the deltas could be technically different
			return {state: true};
		}

		if(incomingValue < currentValue){
			return {converge: true, current: true};
		}
		if(currentValue < incomingValue){
			return {converge: true, incoming: true};
		}
	}
	return {err: "Invalid CRDT Data: "+ incomingValue +" to "+ currentValue +" at "+ incomingState +" to "+ currentState +"!"};
}

function broadcast (msg, sockId) {
  console.log('called broadcast:', msg, sockId);
  console.log(conns);
  if(conns) {
    var l = conns.length;
    for(let item of conns) {
      console.log('item', item);
      
    }

  }
}
