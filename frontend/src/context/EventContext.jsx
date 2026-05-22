import { createContext, useContext, useReducer } from 'react'

const EventContext = createContext(null)

const initialState = {
  events: [],
  stats: null,
  threats: [],
  mitigations: [],
}

function eventReducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events].slice(0, 500) }
    case 'ADD_THREAT':
      return { ...state, threats: [action.payload, ...state.threats].slice(0, 100) }
    case 'ADD_MITIGATION':
      return { ...state, mitigations: [action.payload, ...state.mitigations].slice(0, 200) }
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    default:
      return state
  }
}

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialState)

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEventContext must be inside EventProvider')
  return ctx
}
