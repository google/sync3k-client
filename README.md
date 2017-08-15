# sync3k-client

`sync3k` is an offline-first event-sourcing synchronization engine with optional end-to-end encryption.

## Installation

Install with `npm`:

```sh
npm install --save sync3k-client
```

Refer to [sync3k-server](https://github.com/google/sync3k-server) for installing server-side components.

## Usage

Currently, `sync3k-client` is offered as a `redux` store enhancer. First, use sync3k store enhancer when creating a store:

```javascript
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducers';
import { enhancer } from 'sync3k-client';

const store = createStore(
  reducer, // existing reducers for the application
  compose(
    enhancer,
    applyMiddleware(
      // other middlewares...
    )
  ));
```

Then, dispatch an `initializeSync` message with websocket base url to `sync3k-server`, topic name, optional password for encryption (or empty string), and a boolean indicating whether to ask for encryption keys.

```javascript
this.props.dispatch(
  actions.initializeSync(`ws://${serverLocation}:8080/kafka`, newTopic, password, askForKeys));
```

`sync3k-client` enhancer maintains several states under `sync3k`. Please refer to [Sync3kState type declaration](src/states/sync3kState.d.ts) for available fields. Also take a look at the included `notetaking-app` [example](examples/notetaking-app/src/App.tsx) for dealing with `sync3k` states.

Disclaimer: This is not an official Google product.
