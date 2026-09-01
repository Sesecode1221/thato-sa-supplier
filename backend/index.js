require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const jwt = require('jsonwebtoken');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const JWT_SECRET = process.env.JWT_SECRET || 'sasuppliers_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const graphqlHandler = expressMiddleware(server, {
    context: async ({ req }) => {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
          return { user: decoded };
        } catch {}
      }
      return { user: null };
    }
  });

  app.use('/graphql', graphqlHandler);
  app.use('/api/graphql', graphqlHandler);

  app.get('/health', (_, res) => res.json({ status: 'ok' }));
  app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

  // Serve Frontend Static Assets
  const buildPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send('Building frontend... please refresh in a moment.');
      }
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SAsuppliers running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
