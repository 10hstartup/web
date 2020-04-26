const express = require('express');
const { Instance } = require('chalk');
const { join } = require('path');

const v1Routes = require('./../controllers/v1.js');
const externalRoutes = require('./../controllers/external.js');
const rootRoutes = require('./../controllers/index.js');

const chalk = new Instance({ level: 3 });

const app = express();

class App {
  constructor(
    port = (process.env.PORT = 3000),
    environment = (process.env.NODE_ENV = 'development')
  ) {
    this._port = port;
    this._environment = environment === 'production' ? true : false;
  }

  start() {
    app.enable('trust proxy', true);

    app.disable('view cache');
    app.set('view engine', 'ejs');
    app.set('views', join(__dirname, './../views'));

    app.use(require('express-boom')());
    app.use(require('cookie-parser')());
    app.use(require('cors')());
    app.use(require('compression')());
    app.use(require('helmet')());
    app.use(require('body-parser').urlencoded({ extended: true }));
    app.use(require('body-parser').json());
    if (!this._environment) {
      app.use(
        require('morgan')((tokens, req, res) => {
          return [
            chalk.bgHex('#6c63ff').hex('#000').bold(' HERO '),
            tokens.method(req, res),
            tokens.status(req, res),
            chalk.hex('#6c63ff').bold(tokens.url(req, res)),
            `${tokens['response-time'](req, res)}ms`,
            chalk.hex('#6c63ff').bold(`${tokens.referrer(req, res)}`),
          ].join(' ');
        })
      );
    }
    app.use(express.static('public'));

    app.use(
      '/v1',
      require('express-rate-limit')({
        windowMs: 1000,
        max: 1000,
        headers: true,
        handler: (_req, res) => {
          res.boom.tooManyRequests();
        },
      })
    );

    app.use('/v1', v1Routes);
    app.use('/r', externalRoutes);
    app.use(rootRoutes);

    app.listen(this._port, () => {
      if (this._environment) {
        console.log(
          `\n${chalk.bgHex('#6c63ff').hex('#000').bold(' HERO ')} ${chalk.hex('#6c63ff')(
            `Listening on port ${this._port}`
          )}`
        );
        console.log(`
    App running at:
    - Local:   ${chalk.hex('#6c63ff')(`http://localhost:${chalk.hex('#6c63ff').bold(this._port)}`)}
    - Network: ${chalk.hex('#6c63ff')(
      `http://${require('ip').address()}:${chalk.hex('#6c63ff').bold(this._port)}`
    )} ${chalk.cyan('(deprecated)')}
  
    Note that if you are developing, you should use the dev server.
    To start a development server, run ${chalk.hex('#6c63ff')(`yarn dev`)}
        `);
      } else {
        console.log(
          `\n${chalk.bgHex('#6c63ff').hex('#000').bold(' HERO ')} ${chalk.hex('#6c63ff')(
            `Listening on port ${this._port}`
          )}`
        );
        console.log(`
    App running at:
    - Local:   ${chalk.hex('#6c63ff')(`http://localhost:${chalk.hex('#6c63ff').bold(this._port)}`)}
    - Network: ${chalk.hex('#6c63ff')(
      `http://${require('ip').address()}:${chalk.hex('#6c63ff').bold(this._port)}`
    )} ${chalk.cyan('(deprecated)')}
  
    Note that the development server is not optimized
    To start a production server, run ${chalk.hex('#6c63ff')(`yarn start`)}
        `);
      }
    });
  }
}

module.exports = App;
