# Control Tower API Gateway

A development-only API Gateway tool 

[![Build Status](https://travis-ci.com/resource-watch/control-tower.svg?branch=main)](https://travis-ci.com/resource-watch/control-tower)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6998e7a532fb2d138ca3/test_coverage)](https://codeclimate.com/github/resource-watch/control-tower/test_coverage)

## Dependencies

Control Tower is built using [Node.js](https://nodejs.org/en/), and can be executed either natively or using Docker,
each of which has its own set of requirements.

Native execution requires:

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/)

Execution using Docker requires:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Getting started

Start by cloning the repository from github to your execution environment

```
git clone https://github.com/resource-watch/control-tower.git && cd control-tower
```

After that, follow one of the instructions below:

### Using native execution

1 - Set up your environment variables. See `dev.env.sample` for a list of variables you should set, which are described
in detail in [this section](#environment-variables) of the documentation. Native execution will NOT load the `dev.env`
file content, so you need to use another way to define those values

2 - Install node dependencies using Yarn:

```
yarn install
```

3 - Start the application server:

```
yarn start
```

Control Tower should now be up and accessible. To confirm, open [http://localhost:9000](http://localhost:9000/) (
assuming the default settings) on your browser, which should show a 404 'Endpoint not found' message.

### Using Docker

1 - Create and complete your `dev.env` file with your configuration. The meaning of the variables is available in
this [section](#documentation-environment-variables). You can find an example `dev.env.sample` file in the project root.

2 - Execute the following command to run Control tower:

```
./controlTower.sh develop
```

3 - It's recommended to add the following line to your `/etc/hosts` (if you are in Windows, the hosts file is located
in `c:\Windows\System32\Drivers\etc\hosts` and you'll need to 'Run as administrator' your editor):

```
mymachine   <yourIP>
```

Control Tower should now be up and accessible. To confirm, open [http://mymachine:9000](http://mymachine:9000/) on your
browser, which should show a 404 'Endpoint not found' message.

## Testing

There are two ways to run the included tests:

### Using native execution

Follow the instruction above for setting up the runtime environment for native execution, then run:

```
yarn test
```

### Using Docker

Follow the instruction above for setting up the runtime environment for Docker execution, then run:

```
./controlTower.sh test
```


## Documentation


### Environment variables

Core Variables

- PORT => The port where control-tower listens for requests. Defaults to 9000 when not set.
- NODE_ENV => Environment variable of nodejs. Required.
- NODE_PATH => Required value. Always set it to 'app/src'.
- PUBLIC_URL => Base Application URL. It must be the public domain of your Control Tower instance, and it's used to
  compose account links. It you are offering a local OAuth provider it's a required field. This URL also needs to be
  configured as an acceptable callback on the OAuth provider settings.

## Contributing

1. Fork it!
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some new feature'`
4. Push the commit to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request :D
