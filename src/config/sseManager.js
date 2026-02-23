class SSEManager {

  constructor() {
    this.clients = new Map(); // userId -> response
  }

  addClient(userId, res) {
    this.clients.set(userId, res);
  }

  removeClient(userId) {
    this.clients.delete(userId);
  }

  send(userId, payload) {
    const client = this.clients.get(userId);

    if (client) {
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  broadcast(userIds, payload) {
    for (const id of userIds) {
      this.send(id, payload);
    }
  }
}

export default new SSEManager();