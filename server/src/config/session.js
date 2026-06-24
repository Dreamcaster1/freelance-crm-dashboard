import session from 'express-session'
import expressMysqlSession from 'express-mysql-session'
import { sessionPool } from './db.js'

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required')
}

const MySQLStore = expressMysqlSession(session)

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
    },
  },
  sessionPool,
)

export default session({
  name: 'clientflow.sid', 
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
})
