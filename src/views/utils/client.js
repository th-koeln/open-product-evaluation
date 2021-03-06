import { ApolloClient } from 'apollo-client'
import { ApolloLink, Observable, split } from 'apollo-link'
import { createUploadLink } from 'apollo-upload-client'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { getMainDefinition } from 'apollo-utilities'
import { onError } from 'apollo-link-error'
import Store from './../store/store.js'
import introspectionQueryResultData from './fragments.json'

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
}

const cache = new InMemoryCache({ fragmentMatcher })

const request = async (operation) => {
  let token = null
  let headers = {
    headers: {},
  }

  if (localStorage.getItem('currentUser') !== null) {
    token = await JSON.parse(localStorage.getItem('currentUser')).token
  }

  if (token) {
    headers = {
      headers: {
        authorization: token ? `Bearer ${token}` : null,
      },
    }
  }
  operation.setContext(headers)
}

const requestLink = new ApolloLink((operation, forward) => new Observable((observer) => {
  let handle
  Promise.resolve(operation)
    .then(oper => request(oper))
    .then(() => {
      handle = forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      })
    })
    .catch(observer.error.bind(observer))

  return () => {
    if (handle) handle.unsubscribe()
  }
}))

const getToken = () => {
  if (localStorage.getItem('currentUser') !== null) {
    return JSON.parse(localStorage.getItem('currentUser')).token
  }
  return null
}

const wsLink = new SubscriptionClient(process.env.VUE_APP_SUBSCRIPTION, {
  reconnect: true,
  lazy: true,
  connectionParams:() => {
    return { Authorization: `Bearer ${getToken()}` }
  },
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  let shouldLogout = false
  
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      if (message === 'Authorization failed') {
        shouldLogout = true
      }
    })
    if (shouldLogout) {
      Store.dispatch('logout')
    }
  }
  if (networkError) {
    if (networkError.statusCode === 401) {
      Store.dispatch('logout')
    }
  }
})

const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  requestLink,
)

export default {
  apollo: new ApolloClient({
    link: ApolloLink.from([
      errorLink,
      link,
      createUploadLink(),
    ]),
    cache,
    defaultOptions,
    connectToDevTools: true,
  }),
  defaultHttpLink: false,
  subscription: wsLink,
}