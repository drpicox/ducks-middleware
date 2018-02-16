const { createStore, applyMiddleware } = require('redux')
const ducksMiddleware = require('../')

describe('ducksMiddleware', () => {
  const INCREMENT = 'INCREMENT'
  const DECREMENT = 'DECREMENT'

  const increment = () => ({ type: INCREMENT })
  const decrement = () => ({ type: DECREMENT })

  const reducer = (state = 0, action) => {
    switch (action.type) {
      case INCREMENT:
        return state + 1
      case DECREMENT:
        return state - 1
      default:
        return state
    }
  }

  const duckWithoutMiddleware = {}
  const duckWatch = {
    middleware: state => {
      console.log('state', state)
      return next => {
        console.log('next', next)
        return action => {
          console.log('action', action)
        }
      }
    },
  }
  const duckRepeatNext = {
    middleware: () => next => action => {
      next(action)
      next(action)
    },
  }
  const duckPreventNegative = {
    middleware: ({ getState }) => next => action => {
      if (getState() > 0 || action.type !== 'DECREMENT') {
        next(action)
      }
    },
  }
  const duckRepeatDispatch = {
    middleware: ({ dispatch }) => next => action => {
      next(action)
      if (!action.repeated) {
        dispatch({
          ...action,
          repeated: true,
        })
      }
    },
  }

  it('creates a middleware from ducks', () => {
    const ducks = { duckRepeatNext }
    const middleware = ducksMiddleware(ducks)
    const store = createStore(reducer, applyMiddleware(middleware))

    store.dispatch(increment())
    const state = store.getState()

    expect(state).toEqual(2)
  })

  it('gives access to getState from store', () => {
    const ducks = { duckPreventNegative }
    const middleware = ducksMiddleware(ducks)
    const store = createStore(reducer, applyMiddleware(middleware))

    store.dispatch(decrement())
    const state = store.getState()

    expect(state).toEqual(0)
  })

  it('gives access to dispatch from store', () => {
    const ducks = { duckRepeatDispatch }
    const middleware = ducksMiddleware(ducks)
    const store = createStore(reducer, applyMiddleware(middleware))

    store.dispatch(increment())
    const state = store.getState()

    expect(state).toEqual(2)
  })

  it('allows to combine multiple ducks', () => {
    const ducks = { duckPreventNegative, duckRepeatDispatch }
    const middleware = ducksMiddleware(ducks)
    const store = createStore(reducer, 1, applyMiddleware(middleware))

    store.dispatch(decrement())
    const state = store.getState()

    expect(state).toEqual(0)
  })
})
