# redux-sync3k

`redux-sync3k` is an offline-first event-sourcing synchronization engine with optional end-to-end encryption.

## Installation

Install with `npm`:

```sh
npm install --save redux-sync3k
```

## Usage

First, use sync3k store enhancer when creating a store:

```javascript
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducers';
import { enhancer } from 'redux-sync3k';

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

`redux-sync3k` enhancer maintains several states under `sync3k`. Please refer to [Sync3kState type declaration](src/states/sync3kState.d.ts) for available fields. Also take a look at the included `notetaking-app` [example](examples/notetaking-app/src/App.tsx) for dealing with `sync3k` states.

Disclaimer: This is not an official Google product.
