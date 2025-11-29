/*
 * Built by Gemini 3
 */

import sinon from 'sinon'
import { expect } from 'chai'
import https from 'https'
import { UserModel } from '../../models/user'
import { BasketModel } from '../../models/basket'
import * as security from '../../lib/insecurity'
import { oauthLogin } from '../../routes/oauthLogin'
import { EventEmitter } from 'events'

describe('oauthLogin', () => {
    let req: any
    let res: any
    let next: any
    let httpsGetStub: sinon.SinonStub
    let userModelFindOneStub: sinon.SinonStub
    let userModelCreateStub: sinon.SinonStub
    let basketModelFindOrCreateStub: sinon.SinonStub
    let securityAuthorizeStub: sinon.SinonStub
    let securityAuthenticatedUsersPutStub: sinon.SinonStub

    beforeEach(() => {
        req = { body: { accessToken: 'test-token' }, ip: '127.0.0.1' }
        res = { status: sinon.stub().returnsThis(), json: sinon.spy() }
        next = sinon.spy()

        httpsGetStub = sinon.stub(https, 'get')
        userModelFindOneStub = sinon.stub(UserModel, 'findOne')
        userModelCreateStub = sinon.stub(UserModel, 'create')
        basketModelFindOrCreateStub = sinon.stub(BasketModel, 'findOrCreate')
        securityAuthorizeStub = sinon.stub(security, 'authorize')
        securityAuthenticatedUsersPutStub = sinon.stub(security.authenticatedUsers, 'put')
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should login existing user', () => {
        const mockResponse = new EventEmitter() as any
        mockResponse.statusCode = 200
        httpsGetStub.callsFake((url: string, callback: any) => {
            callback(mockResponse)
            mockResponse.emit('data', JSON.stringify({ email: 'test@test.com' }))
            mockResponse.emit('end')
            return { on: sinon.stub() }
        })

        const mockUser = { id: 1, email: 'test@test.com' }
        userModelFindOneStub.resolves(mockUser)
        basketModelFindOrCreateStub.resolves([{ id: 123 }, true])
        securityAuthorizeStub.returns('mock-jwt-token')

        oauthLogin()(req, res, next)

        return new Promise(resolve => setTimeout(resolve, 20)).then(() => {
            expect(userModelFindOneStub.called).to.be.true
            expect(basketModelFindOrCreateStub.called).to.be.true
            expect(res.json.calledWith({ authentication: { token: 'mock-jwt-token', bid: 123, umail: 'test@test.com' } })).to.be.true
        })
    })

    it('should create and login new user', () => {
        const mockResponse = new EventEmitter() as any
        mockResponse.statusCode = 200
        httpsGetStub.callsFake((url: string, callback: any) => {
            callback(mockResponse)
            mockResponse.emit('data', JSON.stringify({ email: 'new@test.com' }))
            mockResponse.emit('end')
            return { on: sinon.stub() }
        })

        userModelFindOneStub.resolves(null)
        const mockNewUser = { id: 2, email: 'new@test.com' }
        userModelCreateStub.resolves(mockNewUser)
        basketModelFindOrCreateStub.resolves([{ id: 456 }, true])
        securityAuthorizeStub.returns('mock-jwt-token-2')

        oauthLogin()(req, res, next)

        return new Promise(resolve => setTimeout(resolve, 20)).then(() => {
            expect(userModelCreateStub.called).to.be.true
            expect(res.json.calledWith({ authentication: { token: 'mock-jwt-token-2', bid: 456, umail: 'new@test.com' } })).to.be.true
        })
    })

    it('should handle invalid token', () => {
        const mockResponse = new EventEmitter() as any
        mockResponse.statusCode = 401
        httpsGetStub.callsFake((url: string, callback: any) => {
            callback(mockResponse)
            mockResponse.emit('end')
            return { on: sinon.stub() }
        })

        oauthLogin()(req, res, next)

        expect(res.status.calledWith(401)).to.be.true
        expect(res.json.calledWith({ error: 'Invalid access token' })).to.be.true
    })
})
