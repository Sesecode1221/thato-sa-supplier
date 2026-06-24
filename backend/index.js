require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const jwt = require('jsonwebtoken');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const JWT_SECRET = process.env.JWT_SECRET || 'sasuppliers_secret';
const PORT = process.env.PORT || 4000;

async function start() {
  const app = express();
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  app.use(express.json());

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server, {
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
  }));

  app.get('/health', (_, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`));
}

start().catch(console.error);
