require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const jwt = require('jsonwebtoken');
const typeDefs = require('../backend/typeDefs');
const resolvers = require('../backend/resolvers');

const JWT_SECRET = process.env.JWT_SECRET || 'sasuppliers_secret';

const server = new ApolloServer({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
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

module.exports = handler;
