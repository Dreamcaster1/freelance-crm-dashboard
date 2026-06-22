import session from 'express-session'
import expressMysqlSession from 'express-mysql-session'

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required')
}

// Single source of truth for how long a session lives.
// Both the cookie maxAge and the MySQL store expiration use this value
// so they cannot silently drift apart.
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const MySQLStore = expressMysqlSession(session)

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: SESSION_TTL_MS,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
  },
})

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
    maxAge: SESSION_TTL_MS,
  },
})
