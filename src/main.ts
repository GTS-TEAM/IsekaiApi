import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { NotFoundExceptionFilter } from './common/error/catch.dto';

// somewhere in your initialization file

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console(),

      new winston.transports.File({
        filename: 'logs/combined/Combined-' + new Date(Date.now()).toDateString() + '.log',
        level: 'info',
        handleExceptions: true,
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.errors({ stack: true }),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, context, timestamp, stack, trace }) => {
            return `${timestamp} [${context}] ${level}: ${message} ${stack ? stack : ''} ${trace ? trace : ''}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error/Errors-' + new Date(Date.now()).toDateString() + '.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/debug/Debug-' + new Date(Date.now()).toDateString() + '.log',
        level: 'debug',
        handleExceptions: true,
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.errors({ stack: true }),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, context, timestamp, stack, trace }) => {
            return `${timestamp} [${context}] ${level}: ${message} ${stack ? stack : ''} ${trace ? trace : ''}`;
          }),
        ),
      }),
    ],
    exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'DD/MM/YYYY, HH:mm:ss',
      }),
      winston.format.printf(
        (log) =>
          `[Nest] - ${[log.timestamp]} ${log.level.toUpperCase()} [${log.context ? log.context : log.stack}] : ${
            log.message
          }`,
      ),
    ),
  });
  let appOptions = {};
  if (process.env.NODE_ENV === 'production') {
    appOptions = { ...appOptions, cors: true, logger };
  }
  const app = await NestFactory.create(AppModule, appOptions);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(compression());
  app.useGlobalFilters(new NotFoundExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  const options = new DocumentBuilder().addBearerAuth().setTitle('ISEKAI API').setVersion('1.0.0').build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  await app.listen(port || 8080);
}
bootstrap();
