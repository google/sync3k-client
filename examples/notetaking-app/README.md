# Notetaking App Example

This example shows how an ordinary React-Redux application can be transformed with `sync3k-client`.

## Run

Due to the potential conflicts with different test frameworks when compiling typescripts, it is necessary to prune out dev dependencies of sync3k-client before running the example.

```bash
~/sync3k-client$ npm install # install everything to run build
~/sync3k-client$ npm run-script build
~/sync3k-client$ npm prune --production # remove dev packages

~/sync3k-client$ cd examples/notetaking-app
~/sync3k-client/examples/notetaking-app$ npm install
~/sync3k-client/examples/notetaking-app$ npm start
```
