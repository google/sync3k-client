import uuidV4 = require('uuid/v4');

export const newRootItem = (item) => ({
  type: 'NEW_ROOT_ITEM',
  item,
});

export const newItem = (parentKey, item) => ({
  type: 'NEW_ITEM',
  parentKey,
  item: {
    ...item,
    key: uuidV4(),
  },
});

export const saveItem = (key, item) => ({
  type: 'SAVE_ITEM',
  key,
  item,
});

export const removeItem = (key) => ({
  type: 'REMOVE_ITEM',
  key,
});

export const moveItem = (key, direction) => ({
  type: 'MOVE_ITEM',
  key,
  direction,
});
