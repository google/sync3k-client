import * as React from 'react';
import { Component } from 'react';

import Item from './Item';

export default class Folder extends Component<{items: Array<{key: string}>}, {}> {
  render() {
    return (
      <ul>
      {this.props.items.map((i) => <Item key={i.key} item={i} />)}
      </ul>
    );
  }
}
