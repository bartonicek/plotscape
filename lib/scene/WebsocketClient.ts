import { Plot } from "../main";
import { Reactive } from "../utils/Reactive";

export type Target =
  | `session`
  | `scene`
  | `plot${number}`
  | `${Plot.Type}${number}`;

interface Message {
  sender: `session` | `scene`;
  target: Target;
  type: string;
  data?: Record<string, any>;
}

export interface WebSocketClient {
  url: string;
  socket: WebSocket;
  targetfn: (id: Target) => Reactive | undefined;
  handlers: Record<string, ((data: any) => void)[]>;
}

export namespace WebSocketClient {
  export function of(
    url: string,
    targetfn: (id: Target) => Reactive | undefined,
  ): WebSocketClient {
    const socket = new WebSocket(url);
    const handlers = {} as Record<string, ((data: any) => void)[]>;
    const client = { url, socket, targetfn, handlers };

    socket.addEventListener(`message`, (msg) => {
      handleMessage(client, JSON.parse(msg.data));
    });

    return client;
  }

  export function handleMessage(client: WebSocketClient, message: Message) {
    const { targetfn } = client;
    const { type, target: targetId, data } = message;
    const target = targetfn(targetId);
    if (target) Reactive.dispatch(target, type, data);
  }

  export function send(
    client: WebSocketClient,
    type: string,
    data: Record<string, any>,
  ) {
    const [sender, target] = [`scene`, `session`] as const;
    const msg: Message = { sender, target, type, data };
    const message = JSON.stringify(msg);
    client.socket.send(message);
  }
}
