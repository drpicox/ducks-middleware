ducksMiddleware ![building status](https://api.travis-ci.org/drpicox/ducks-middleware.svg?branch=master)
===============

Extract all available middleware from a ducks object and creates
a middleware with all available middleware.


It uses reducers defined as ducks, see
[ducks-modular-redux](https://github.com/erikras/ducks-modular-redux)
(aka isolated modules), and creates middleware that composes of existing
middleware from ducks property middleware with no specific order
that can be applyied with
[applyMiddleware](https://redux.js.org/docs/api/applyMiddleware.html).


Quick Use
---------

Install with npm:

```bash
npm install ducks-middleware
```

```javascript
// index.js
import ducksReducer from 'ducks-reducer'
import ducksMiddleware from 'ducks-middleware'

import * as comments from './comments'
import * as posts from './posts'
import * as users from './users'

const ducks = { comments, posts, users }
const reducer = ducksReducer(ducks)
const middleware = ducksMiddleware(ducks)

// ...do your stuff...

const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(middleware)
)

// ...do your stuff...
```

```javascript
// comments.js
export default function commentsReducer(state, action) {
  switch (action.type) {
    // Do here your reducer magic
    default: return state
  }
}

export const middleware = store => next => action => {
  next(action);
  // Do here your middleware magic
};

// ...
```


ducksMiddleware(_ducks_)
------------------------

It creates a middleware with all the middleware
from the given reducers.

It assumes that ducks may have a middleware property that can
be composed as a single middleware.

```javascript
const ducks = { comments, posts, users }
const reducer = ducksReducer(ducks)
const middleware = ducksMiddleware(ducks)
const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(middleware)
)
```

```javascript
// equivalent without ducksMiddleware
const reducer = ducksReducer({ comments, posts, users })
const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(comments.middleware, posts.middleware, users.middleware)
)
```

Because EcmaScript does not ensure any exact order to traverse 
Object properties, it is possible that middleware order can be altered
from execution to execution.

```javascript
// without ducksMiddleware any middleware order should be valid
const reducer = ducksReducer({ comments, posts, users })
const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(comments.middleware, users.middleware, posts.middleware)
)
```

If any duck has no middleware property, it is ignored.

```javascript
// equivalent without ducksMiddleware in which users does not have middleware
const reducer = ducksReducer({ comments, posts, users })
const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(comments.middleware, posts.middleware)
)
```


Duck with Middleware Example
----------------------------

```javascript
// posts.js

// Actions
export const FETCH_POSTS = 'FETCH_POSTS'
export const FETCH_POSTS_FULFILLED = 'FETCH_POSTS_FULFILLED'

// Action creators
export const fetchPosts = () => ({ type: FETCH_POSTS })
export const fetchPostsFulfilled = (payload) => ({ 
  type: FETCH_POSTS,
  payload,
})

// Selectors
export const getPosts = (state) => state.posts

// Reducer
export default function postsReducer(state = [], action) => {
  switch (action.type) {
    case FETCH_POSTS_FULFILLED:
      return action.payload
    default: return state
  }
}

// Middleware
export const middleware = ({ dispatch }) => next => async (action) => {
  next(action);
  if (action.type === FETCH_POSTS) {
    const response = await fetch('/api/posts')
    const payload = await response.json()
    dispatch(fetchPostsFulfilled(payload))
  }
}
```


Why middleware instead of thunks
--------------------------------

In the previous example, the middleware was the following:

```javascript
export const middleware = ({ dispatch }) => next => async (action) => {
  next(action);
  if (action.type === FETCH_POSTS) {
    const response = await fetch('/api/posts')
    const payload = await response.json()
    dispatch(fetchPostsFulfilled(payload))
  }
}
```

the same logic can be implemented with a thunk 
(in this case `redux-async-thunk`) which requires to replace `fetchPosts` 
with the following action creator:

```javascript
export const fetchPosts = () => {
  return async ({ dispatch }) => {
    dispatch({ type: FETCH_POSTS })

    const response = await fetch('/api/posts')
    const payload = await response.json()
    dispatch(fetchPostsFulfilled(payload))
  }
}
```

Both codes are almost the same, and satisfies the same behavior.
The difference is the extensibility and the responsibility inversion:
Once you have defined `fetchPosts` in one duck module, you should not
change it. It will always fetch posts and nothing else. 
¿What if you decide that you want also to fetch comments 
at the same time than posts? You cannot unless you modify `fetchPosts`.

With middlewares this limitation dissapears. Now in your _comments duck_
you can add a middleware to add comments, just implement another
middleware like the previous one but fetching comments:

```javascript
import FETCH_POSTS from '../posts';

// ...

export const middleware = ({ dispatch }) => next => async (action) => {
  next(action);
  if (action.type === FETCH_POSTS) {
    dispatch(fetchComments())
  } else if (action.type === FETCH_COMMENTS) {
    const response = await fetch('/api/comments')
    const payload = await response.json()
    dispatch(fetchCommentsFulfilled(payload))
  }
}
```

Or, if you consider more convenient, keep _comments duck_ simple and
add fetch comments when fetching posts in an additional duck.

```javascript
// ./comments.js

// ...

export const middleware = ({ dispatch }) => next => async (action) => {
  next(action);
  if (action.type === FETCH_COMMENTS) {
    const response = await fetch('/api/comments')
    const payload = await response.json()
    dispatch(fetchCommentsFulfilled(payload))
  }
}
```

```javascript
// ./posts-comments.js
import FETCH_POSTS from '../posts';
import fetchComments from '../comments';

export const middleware = ({ dispatch }) => next => action => {
  next(action);
  if (action.type === FETCH_POSTS) {
    dispatch(fetchComments())
  }
}
```

Middlewares and system events
-----------------------------

You can use middleware to generate actions from system events,
for example:

```javascript
// ./window-scroll.js
export const SCROLL_CHANGED = 'SCROLL_CHANGED';
export const scrollChanged = () => ({ type: SCROLL_CHANGED });

export const middleware = ({ dispatch }) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      dispatch(scrollChanged())
    })
  }

  return next => next
}
```


See also
--------

[ducks-reducer](https://github.com/drpicox/ducks-reducer) to compose
ducks reducers.

```javascript
import ducksReducer from 'ducks-reducer'
import ducksMiddleware from 'ducks-middleware'

import * as comments from './comments'
import * as posts from './posts'
import * as users from './users'

const ducks = { comments, posts, users }
const reducer = ducksReducer(ducks)
const middleware = ducksMiddleware(ducks)

// ...do your stuff...

const store = createStore(
  reducer, 
  preloadedState, 
  applyMiddleware(ducksMiddleware)
)

// ...do your stuff...
```
