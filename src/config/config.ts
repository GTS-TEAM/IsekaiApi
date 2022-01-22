export const config = () => ({
  port: process.env.PORT,
  database: {
    type: 'postgres',
    replication: {
      master: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      },
      slaves: [
        {
          host: process.env.DB_READ_HOST1,
          port: process.env.DB_PORT,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
        },
        {
          host: process.env.DB_READ_HOST2,
          port: process.env.DB_PORT,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
        },
      ],
    },
    selector: 'RR',
    removeNodeErrorCount: 1,
    synchronize: true,
    migrationsTableName: 'migrations',
    autoLoadEntities: true,
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
  },
  jwt: {
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
    jwtVerifyEmailExpiration: process.env.JWT_VERIFY_EMAIL_EXPIRATION,
    secret: process.env.JWT_SECRET_KEY,
    resetPasswordExpiration: process.env.JWT_RESET_PASSWORD_EXPIRATION,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    defaultTtl: 30,
  },
  host: {
    url: process.env.HOST_URL,
  },
  email: {
    host: process.env.EMAIL_HOST,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  env: process.env.NODE_ENV,
});
