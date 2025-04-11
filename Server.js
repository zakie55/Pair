const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

let currentPairCode = 'Loading...';

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, fs),
    },
    browser: ['Psycho', 'Chrome', '120.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, pairCode } = update;

    if (pairCode) {
      currentPairCode = pairCode;
      console.log(`PAIR CODE: ${pairCode}`);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log('Disconnected. Reason:', reason);
    }

    if (connection === 'open') {
      console.log('CONNECTED to WhatsApp');
    }
  });
};

startBot();

const app = express();

app.get('/pair-code', (req, res) => {
  res.json({ code: currentPairCode });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on PORT: ${PORT}`);
});
