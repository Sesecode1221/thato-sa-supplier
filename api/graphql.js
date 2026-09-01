require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const jwt = require('jsonwebtoken');
const typeDefs = require('../backend/typeDefs');
const resolvers = require('../backend/resolvers');

const JWT_SECRET = process.env.JWT_SECRET || 'sasuppliers_secret';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

const nextHandler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    if (auth.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
        return { user: decoded };
      } catch {}
    }
    return { user: null };
  }
});

module.exports = async function handler(req, res) {
  // Add CORS headers for Vercel serverless executions
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return nextHandler(req, res);
};
