const users = require('../../../seeds/data/user/user')
const clients = require('../../../seeds/data/client/client')
const domains = require('../../../seeds/data/domain/domain')
const { Seeder } = require('mongo-seeding')
const config = require('../../../../config')
const { unauthRequest, authRequest } = require('../../helper/requests')
const { getSeedID, getNotMatchingID } = require('../../helper/helpers')
const {
  clientAmountQuery,
  clientsQuery,
  clientQuery,
  updateClientMutation,
  deleteClientMutation,
  setClientOwnerMutation,
  removeClientOwnerMutation
} = require('../../requests/client.requests.js')
const { loginUserMutation } = require('../../requests/user.requests')

const seeder = new Seeder(config.seeder)
const collections = seeder.readCollectionsFromPath(config.seeder.inputPath)

describe('User', () => {
  const user = users[0]
  let jwt = ''

  beforeEach(async () => {
    await seeder.import(collections)
    const query = loginUserMutation(user.email, 'password')
    const { data, errors } = await unauthRequest(query)

    expect(data.login).not.toBeNull()
    expect(errors).toBeUndefined()

    const { login: { token } } = data
    jwt = token
  })

  describe('should', async () => {
    it('get the amount of owned clients', async () => {
      const query = clientAmountQuery()
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.clientAmount).toBe(2)
    })
    it('find all owned clients when querying for permanent clients', async () => {
      const query = clientsQuery()
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.clients).toMatchSnapshot()
    })
    it('find it when querying for an owned permanent client', async () => {
      const query = clientQuery(getSeedID(clients[2]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.client).toMatchSnapshot()
    })
    it('update name of an owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[2]),
        { name: 'newName' },
        true,
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.updateClient.client).toMatchSnapshot()
    })
    it('set new domain for owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[2]),
        { domain: getSeedID(domains[0]) },
        true,
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.updateClient.client).toMatchSnapshot()
    })
    it('remove domain from owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[2]),
        { domain: null },
        true,
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.updateClient.client).toMatchSnapshot()
    })
    it('remove owned domain from a not owned client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[4]),
        { domain: null },
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.updateClient.client).toMatchSnapshot()
    })
    it('delete an owned permanent client', async () => {
      const query = deleteClientMutation(getSeedID(clients[2]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.deleteClient.success).toBe(true)
    })
    it('set an owner for an owned permanent client', async () => {
      const query = setClientOwnerMutation(getSeedID(clients[2]), users[1].email)
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.setClientOwner.client).toMatchSnapshot()
    })
    it('remove an owner from an owned permanent client', async () => {
      const query = removeClientOwnerMutation(getSeedID(clients[2]), getSeedID(users[0]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(errors).toBeUndefined()
      expect(data.removeClientOwner.success).toBe(true)
    })
  })
  describe('should not', async () => {
    it('find it when querying for a not owned permanent client', async () => {
      const query = clientQuery(getSeedID(clients[0]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('find it when querying for a temporary client', async () => {
      const query = clientQuery(getSeedID(clients[4]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('see owners of not owned devices', async () => {
      const query = clientQuery(getSeedID(clients[4]), true)
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('update name of a not owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[0]),
        { name: 'newName' },
        true,
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('change the name of a temporary client', async () => {
      const query = updateClientMutation(getSeedID(clients[4]),
        { name: 'notAllowedNameChange' },
      )

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set new domain for a temporary client', async () => {
      const query = updateClientMutation(getSeedID(clients[4]),
        { domain: getSeedID(domains[0]) },
      )

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set new domain for not owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[0]),
        { domain: getSeedID(domains[1]) },
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set a non existing domain for an owned permanent client', async () => {
      const query = updateClientMutation(getSeedID(clients[2]),
        { domain: getNotMatchingID() },
      )

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set an empty name for an owned permanent client', async () => {
      const query = updateClientMutation(getSeedID(clients[2]),
        { name: null },
      )

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('remove not owned domain from not owned permanent client', async () => {
      const query = updateClientMutation(
        getSeedID(clients[0]),
        { domain: null },
      )
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })

    it('delete a not owned permanent client', async () => {
      const query = deleteClientMutation(getSeedID(clients[0]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })

    it('delete a temporary client', async () => {
      const query = deleteClientMutation(getSeedID(clients[4]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('delete a non existing client', async () => {
      const query = deleteClientMutation(getNotMatchingID())

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set an owner for a not owned permanent client', async () => {
      const query = setClientOwnerMutation(getSeedID(clients[0]), users[0].email)
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set a non existing owner for a permanent client', async () => {
      const query = setClientOwnerMutation(getSeedID(clients[0]), 'notFound@user.com')

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('set an owner for a temporary client', async () => {
      const query = setClientOwnerMutation(getSeedID(clients[4]), getSeedID(users[0]))

      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('remove an owner from a not owned permanent client', async () => {
      const query = removeClientOwnerMutation(getSeedID(clients[0]), getSeedID(users[1]))
      const res = await authRequest(query, jwt)
      const { data, errors } = res

      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
